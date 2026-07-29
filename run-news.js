process.env.NODE_PATH = '/usr/local/lib/node_modules/n8n/node_modules:' + '/home/node/.n8n/custom/n8n-nodes-daily-news-agent/node_modules:' + require('module')._nodeModulePaths('/home/node').join(':');
require('module')._initPaths();

var RssParser = require('rss-parser');
var parser = new RssParser({ headers: { 'User-Agent': 'n8n-agent/0.1' } });
var BASE = 'https://open.feishu.cn/open-apis';

var APP_ID = process.env.FEISHU_APP_ID;
var APP_SECRET = process.env.FEISHU_APP_SECRET;
var APP_TOKEN = process.env.FEISHU_APP_TOKEN;
var TABLE_ID = process.env.FEISHU_TABLE_ID;
var USER_OPEN_ID = process.env.FEISHU_USER_OPEN_ID;
var NL = '\n';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

async function getToken() {
  var r = await fetch(BASE + '/auth/v3/tenant_access_token/internal', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  return (await r.json()).tenant_access_token;
}

async function main() {
  console.log(NL + '📰 Daily News Agent — ' + new Date().toISOString());
  var token = await getToken();

  // Fetch 36kr with per-article summaries from RSS
  var feed = await parser.parseURL('https://36kr.com/feed');
  var hotNews = [];
  for (var i = 0; i < Math.min(5, feed.items.length); i++) {
    var item = feed.items[i];
    var snippet = stripHtml(item.contentSnippet || item.content || '');
    // Trim to ~200 chars for a proper summary
    if (snippet.length > 250) snippet = snippet.substring(0, 250).replace(/\S+$/, '') + '...';
    if (!snippet) snippet = '来自36氪的热点新闻';
    hotNews.push({
      title: item.title || '',
      url: item.link || '',
      source: '36氪',
      summary: snippet
    });
  }
  console.log('✅ 36kr: ' + hotNews.length + ' items (each with summary)');

  // Fetch Hacker News with per-article summaries
  var ids = (await (await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')).json()).slice(0, 15);
  var techNews = [];
  for (var idx = 0; idx < ids.length; idx++) {
    if (techNews.length >= 5) break;
    var s = await (await fetch('https://hacker-news.firebaseio.com/v0/item/' + ids[idx] + '.json')).json();
    if (s && s.title) {
      // Generate a meaningful summary for HN articles
      var hnSummary = '来自 Hacker News 热门讨论';
      if (s.score) hnSummary += '，当前热度 ' + s.score + ' 分';
      if (s.descendants) hnSummary += '，' + s.descendants + ' 条讨论';
      hnSummary += '。原文标题：' + s.title;
      if (s.url) hnSummary += '。点击链接查看完整内容。';
      if (hnSummary.length > 250) hnSummary = hnSummary.substring(0, 250).replace(/\S+$/, '') + '...';
      techNews.push({
        title: s.title,
        url: s.url || 'https://news.ycombinator.com/item?id=' + ids[idx],
        source: 'Hacker News',
        score: s.score,
        summary: hnSummary
      });
    }
  }
  console.log('✅ HN: ' + techNews.length + ' items (each with summary)');

  // Global summary for bot message card
  var today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  var globalSummary = '📰 每日新闻概要 | ' + today + NL + NL;
  globalSummary += '🔥 热点新闻 (36氪):' + NL;
  for (var j = 0; j < hotNews.length; j++) {
    globalSummary += NL + '**' + (j+1) + '. ' + hotNews[j].title + '**' + NL;
    globalSummary += '> ' + hotNews[j].summary.substring(0, 150) + NL;
  }
  globalSummary += NL + '💻 科技新闻 (Hacker News):' + NL;
  for (var k = 0; k < techNews.length; k++) {
    globalSummary += NL + '**' + (k+1) + '. ' + techNews[k].title + '** (⬆' + (techNews[k].score || '?') + ')' + NL;
  }
  globalSummary += NL + '📌 36氪 + Hacker News | 🤖 Daily News Agent';

  // Write to bitable - each record has its own summary
  var records = [];
  for (var l = 0; l < hotNews.length; l++) {
    records.push({ fields: { '文本': hotNews[l].title, '原文链接': hotNews[l].url, '来源': hotNews[l].source, '分类': '热点新闻', 'news_date': Date.now(), '新闻概要': hotNews[l].summary } });
  }
  for (var m = 0; m < techNews.length; m++) {
    records.push({ fields: { '文本': techNews[m].title, '原文链接': techNews[m].url, '来源': techNews[m].source, '分类': '科技新闻', 'news_date': Date.now(), '新闻概要': techNews[m].summary } });
  }

  await fetch(BASE + '/bitable/v1/apps/' + APP_TOKEN + '/tables/' + TABLE_ID + '/records/batch_create', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ records: records }),
  });
  console.log('✅ Bitable: ' + records.length + ' records');

  // Send bot message
  var card = {
    config: { wide_screen_mode: true },
    header: { template: 'blue', title: { content: '📰 每日新闻速递 — ' + today, tag: 'plain_text' } },
    elements: [{ tag: 'markdown', content: globalSummary }],
    note: { elements: [{ tag: 'plain_text', content: '🤖 由 Daily News Agent 自动生成' }] },
  };
  var params = new URLSearchParams({ receive_id_type: 'open_id' });
  await fetch(BASE + '/im/v1/messages?' + params.toString(), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ receive_id: USER_OPEN_ID, msg_type: 'interactive', content: JSON.stringify(card) }),
  });
  console.log('✅ Message sent');
}

main().catch(function(e) { console.error('Error:', e.message); process.exit(1); });
