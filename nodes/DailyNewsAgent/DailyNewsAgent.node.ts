import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import RssParser from 'rss-parser';

// ── Types ──────────────────────────────────────────────────────────

interface NewsItem {
	title: string;
	url: string;
	source: string;
	publishedAt?: string;
	score?: number;
}

interface HnStory {
	id: number;
	title: string;
	url?: string;
	score: number;
	time: number;
}

// ── Helpers ────────────────────────────────────────────────────────

const RSS_PARSER = new RssParser({
	headers: { 'User-Agent': 'n8n-daily-news-agent/0.1' },
});

// ── RSS Feed URL Map ──────────────────────────────────────────

const HOT_NEWS_FEEDS: Record<string, { url: string; label: string }> = {
	'36kr': {
		url: 'https://36kr.com/feed',
		label: '36氪',
	},
	sspai: {
		url: 'https://sspai.com/feed',
		label: '少数派',
	},
};

async function fetchRssNews(url: string, source: string, limit: number): Promise<NewsItem[]> {
	const feed = await RSS_PARSER.parseURL(url);

	return (feed.items || []).slice(0, limit).map((item) => ({
		title: item.title || '(no title)',
		url: item.link || '',
		source: item.source || item.creator || source,
		publishedAt: item.pubDate || item.isoDate || undefined,
	}));
}

async function fetchHackerNews(limit: number): Promise<NewsItem[]> {
	const topIdsResponse = await fetch(
		'https://hacker-news.firebaseio.com/v0/topstories.json',
	);
	const topIds: number[] = (await topIdsResponse.json() as number[]).slice(0, limit * 3);

	const stories: NewsItem[] = [];
	for (const id of topIds) {
		if (stories.length >= limit) break;
		try {
			const itemResponse = await fetch(
				`https://hacker-news.firebaseio.com/v0/item/${id}.json`,
			);
			const story = await itemResponse.json() as HnStory;
			if (story && story.title) {
				stories.push({
					title: story.title,
					url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
					source: 'Hacker News',
					publishedAt: new Date(story.time * 1000).toISOString(),
					score: story.score,
				});
			}
		} catch {
			// skip failed fetches
		}
	}

	return stories;
}

async function callLLMSummary(
	news: NewsItem[],
	category: string,
	language: string,
	provider: string,
	apiKey: string,
	apiBaseUrl: string,
	model: string,
): Promise<string> {
	const headlines = news
		.map((n, i) => `${i + 1}. ${n.title}`)
		.join('\n');

	const prompt =
		language === 'zh-CN'
			? `请用中文简洁总结以下${category}新闻的核心内容（200字以内）：\n\n${headlines}`
			: `Please summarize the following ${category} news headlines concisely (within 200 words):\n\n${headlines}`;

	if (provider === 'openai') {
		const baseUrl = apiBaseUrl || 'https://api.openai.com/v1';
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 400,
				temperature: 0.3,
			}),
		});
		const data = await response.json() as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		return data.choices?.[0]?.message?.content || 'AI summary unavailable';
	}

	if (provider === 'anthropic') {
		const baseUrl = apiBaseUrl || 'https://api.anthropic.com';
		const response = await fetch(`${baseUrl}/v1/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model,
				max_tokens: 400,
				temperature: 0.3,
				system: `You are a helpful news curator. Respond in ${language === 'zh-CN' ? 'Chinese' : 'English'}.`,
				messages: [{ role: 'user', content: prompt }],
			}),
		});
		const data = await response.json() as {
			content?: Array<{ text?: string }>;
		};
		return data.content?.[0]?.text || 'AI summary unavailable';
	}

	return '';
}

// ── Node ───────────────────────────────────────────────────────────

export class DailyNewsAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Daily News Agent',
		name: 'dailyNewsAgent',
		icon: 'file:dailyNewsAgent.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["hotNewsSource"]}} + {{$parameter["techNewsSource"]}}',
		description: 'Fetch daily hot news and tech news with optional AI summarization',
		defaults: {
			name: 'Daily News Agent',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'dailyNewsAgentApi',
				required: false,
			},
		],
		properties: [
			// ── Hot News ──────────────────────────────────
			{
				displayName: 'Hot News Source',
				name: 'hotNewsSource',
				type: 'options',
				options: [
					{ name: '36氪 (36kr)', value: '36kr' },
					{ name: '少数派 (Sspai)', value: 'sspai' },
				],
				default: '36kr',
				description: 'Source for general hot / trending news in China',
			},
			{
				displayName: 'Hot News Count',
				name: 'hotNewsCount',
				type: 'number',
				default: 5,
				description: 'Number of hot news items to fetch',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
			},
			// ── Tech News ─────────────────────────────────
			{
				displayName: 'Tech News Source',
				name: 'techNewsSource',
				type: 'options',
				options: [
					{ name: 'Hacker News', value: 'hackerNews' },
					{ name: '36氪 (36kr)', value: '36kr' },
					{ name: '少数派 (Sspai)', value: 'sspai' },
				],
				default: 'hackerNews',
				description: 'Source for tech / technology news',
			},
			{
				displayName: 'Tech News Count',
				name: 'techNewsCount',
				type: 'number',
				default: 5,
				description: 'Number of tech news items to fetch',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
			},
			// ── AI Summary ────────────────────────────────
			{
				displayName: 'Enable AI Summary',
				name: 'enableAiSummary',
				type: 'boolean',
				default: false,
				description: 'Whether to use an LLM to generate a curated news summary',
			},
			{
				displayName: 'Output Language',
				name: 'language',
				type: 'options',
				options: [
					{ name: '中文', value: 'zh-CN' },
					{ name: 'English', value: 'en' },
				],
				default: 'zh-CN',
				description: 'Language for the AI summary output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const hotNewsSource = this.getNodeParameter('hotNewsSource', i) as string;
			const hotNewsCount = this.getNodeParameter('hotNewsCount', i) as number;
			const techNewsSource = this.getNodeParameter('techNewsSource', i) as string;
			const techNewsCount = this.getNodeParameter('techNewsCount', i) as number;
			const enableAiSummary = this.getNodeParameter('enableAiSummary', i) as boolean;
			const language = this.getNodeParameter('language', i) as string;

			let hotNews: NewsItem[] = [];
			let techNews: NewsItem[] = [];
			let hotSummary = '';
			let techSummary = '';

			// ── Fetch Hot News ────────────────────────
			try {
				const hotFeed = HOT_NEWS_FEEDS[hotNewsSource];
					if (hotFeed) {
						hotNews = await fetchRssNews(hotFeed.url, hotFeed.label, hotNewsCount);
					}
			} catch (err) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to fetch hot news: ${(err as Error).message}`,
				);
			}

			// ── Fetch Tech News ───────────────────────
			try {
				if (techNewsSource === 'hackerNews') {
					techNews = await fetchHackerNews(techNewsCount);
				} else {
					const feed = HOT_NEWS_FEEDS[techNewsSource];
					if (feed) {
						techNews = await fetchRssNews(feed.url, feed.label, techNewsCount);
					}
				}
			} catch (err) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to fetch tech news: ${(err as Error).message}`,
				);
			}

			// ── AI Summary ───────────────────────────
			if (enableAiSummary) {
				try {
					const credentials = await this.getCredentials('dailyNewsAgentApi');
					const provider = credentials.llmProvider as string;
					const apiKey = credentials.apiKey as string;
					const apiBaseUrl = (credentials.apiBaseUrl as string) || '';
					const model = credentials.model as string;

					if (provider !== 'none' && apiKey) {
						hotSummary = await callLLMSummary(
							hotNews,
							language === 'zh-CN' ? '热点' : 'Hot',
							language,
							provider,
							apiKey,
							apiBaseUrl,
							model,
						);
						techSummary = await callLLMSummary(
							techNews,
							language === 'zh-CN' ? '科技' : 'Tech',
							language,
							provider,
							apiKey,
							apiBaseUrl,
							model,
						);
					}
				} catch (err) {
					// AI summary failure shouldn't block the whole node
					hotSummary = `AI summary error: ${(err as Error).message}`;
					techSummary = '';
				}
			}

			returnData.push({
				json: {
					hotNews,
					techNews,
					aiSummary: hotSummary || techSummary
						? `${hotSummary}\n\n${techSummary}`.trim()
						: null,
					generatedAt: new Date().toISOString(),
				},
			});
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
