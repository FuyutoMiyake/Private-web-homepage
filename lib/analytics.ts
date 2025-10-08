import { BetaAnalyticsDataClient } from '@google-analytics/data'

export type AnalyticsData = {
  todayUsers: number
  weekUsers: number
  monthUsers: number
  todayPageViews: number
  weekPageViews: number
  monthPageViews: number
  topPages: Array<{ path: string; views: number }>
  trafficSources: Array<{ source: string; users: number }>
}

/**
 * Get Google Analytics client
 */
function getAnalyticsClient(): BetaAnalyticsDataClient | null {
  const credentials = process.env.GA4_CREDENTIALS

  // Skip if no credentials configured
  if (!credentials) {
    console.warn('GA4_CREDENTIALS not configured')
    return null
  }

  try {
    // Parse base64-encoded JSON credentials
    const decodedCredentials = JSON.parse(
      Buffer.from(credentials, 'base64').toString('utf-8')
    )

    return new BetaAnalyticsDataClient({
      credentials: decodedCredentials,
    })
  } catch (error) {
    console.error('Failed to initialize GA4 client:', error)
    return null
  }
}

/**
 * Fetch analytics data from Google Analytics 4
 */
export async function fetchAnalyticsData(): Promise<AnalyticsData | null> {
  const propertyId = process.env.GA4_PROPERTY_ID

  if (!propertyId) {
    console.warn('GA4_PROPERTY_ID not configured')
    return null
  }

  const client = getAnalyticsClient()
  if (!client) {
    return null
  }

  try {
    // Fetch user metrics for different time periods
    const [todayReport, weekReport, monthReport, topPagesReport, sourcesReport] =
      await Promise.all([
        // Today's users and pageviews
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: 'today', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        }),

        // Last 7 days
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        }),

        // Last 30 days
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        }),

        // Top pages (last 7 days)
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        }),

        // Traffic sources (last 7 days)
        client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 10,
        }),
      ])

    // Parse results
    const todayUsers = parseInt(todayReport[0].rows?.[0]?.metricValues?.[0]?.value || '0')
    const todayPageViews = parseInt(
      todayReport[0].rows?.[0]?.metricValues?.[1]?.value || '0'
    )

    const weekUsers = parseInt(weekReport[0].rows?.[0]?.metricValues?.[0]?.value || '0')
    const weekPageViews = parseInt(weekReport[0].rows?.[0]?.metricValues?.[1]?.value || '0')

    const monthUsers = parseInt(monthReport[0].rows?.[0]?.metricValues?.[0]?.value || '0')
    const monthPageViews = parseInt(
      monthReport[0].rows?.[0]?.metricValues?.[1]?.value || '0'
    )

    const topPages =
      topPagesReport[0].rows?.map((row) => ({
        path: row.dimensionValues?.[0]?.value || '',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || []

    const trafficSources =
      sourcesReport[0].rows?.map((row) => ({
        source: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || []

    return {
      todayUsers,
      weekUsers,
      monthUsers,
      todayPageViews,
      weekPageViews,
      monthPageViews,
      topPages,
      trafficSources,
    }
  } catch (error) {
    console.error('Failed to fetch analytics data:', error)
    return null
  }
}
