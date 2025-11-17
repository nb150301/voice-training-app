import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { recordingsApi, type Recording } from '../lib/api';
import { formatPitch, getPitchColor } from '../lib/pitch';

interface GraphDataPoint {
  timestamp: string;
  date: Date;
  pitch: number;
  label: string;
  color: string;
}

interface PitchHistoryGraphProps {
  timeRange?: '7d' | '30d' | 'all';
}

const TIME_RANGES = {
  '7d': 7,
  '30d': 30,
  'all': 365 * 10 // 10 years effectively all
};

export default function PitchHistoryGraph({ timeRange = '30d' }: PitchHistoryGraphProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    fetchRecordings();
  }, [selectedTimeRange]);

  useEffect(() => {
    if (selectedTimeRange !== timeRange) {
      setSelectedTimeRange(timeRange);
    }
  }, [timeRange]);

  const fetchRecordings = async () => {
    try {
      setIsLoading(true);
      const response = await recordingsApi.list();
      if (response.data?.recordings) {
        setRecordings(response.data.recordings);
        processGraphData(response.data.recordings);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recordings';
      setError(errorMessage);
      console.error('Error fetching recordings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const processGraphData = (recs: Recording[]) => {
    const validRecordings = recs
      .filter(r => r.pitch_hz && r.pitch_hz > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Filter by time range
    const days = TIME_RANGES[selectedTimeRange];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filtered = validRecordings.filter(r => new Date(r.created_at) >= cutoffDate);

    const data: GraphDataPoint[] = filtered.map(rec => ({
      timestamp: new Date(rec.created_at).toLocaleDateString(),
      date: new Date(rec.created_at),
      pitch: rec.pitch_hz!,
      label: formatPitch(rec.pitch_hz),
      color: getPitchColor(rec.pitch_hz!)
    }));

    setGraphData(data);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (graphData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pitch History</h2>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">No recordings with pitch data found for the selected time range.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics for reference lines
  const pitches = graphData.map(d => d.pitch);
  const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Pitch History</h2>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {Object.keys(TIME_RANGES).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Recordings</div>
            <div className="text-xl font-bold text-gray-800">{graphData.length}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600">Average</div>
            <div className={`text-xl font-bold ${getPitchColor(avgPitch)}`}>
              {formatPitch(avgPitch)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600">Range</div>
            <div className="text-xl font-bold text-purple-800">
              {(maxPitch - minPitch).toFixed(1)} Hz
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600">Trend</div>
            <div className="text-xl font-bold text-green-800">
              {graphData.length >= 2 ? (
                graphData[graphData.length - 1].pitch > graphData[0].pitch ? '↑ Rising' : '↓ Falling'
              ) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={graphData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorPitch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="timestamp"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 300]}
              label={{ value: 'Pitch (Hz)', angle: -90, position: 'insideLeft' }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value: number) => [formatPitch(value), 'Pitch']}
              labelFormatter={(label) => `Date: ${label}`}
            />

            <Legend />

            {/* Reference Lines */}
            <ReferenceLine
              y={avgPitch}
              stroke="#6366f1"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: "Average", position: "topLeft" }}
            />

            <ReferenceLine
              y={130}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: "Tenor Start", position: "bottomLeft", fontSize: 10 }}
            />

            <ReferenceLine
              y={98}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: "Baritone Start", position: "bottomLeft", fontSize: 10 }}
            />

            <ReferenceLine
              y={82}
              stroke="#8b5cf6"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: "Bass Start", position: "bottomLeft", fontSize: 10 }}
            />

            <Area
              type="monotone"
              dataKey="pitch"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPitch)"
              name="Pitch"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Voice Range Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-600"></div>
            <span className="text-gray-600">Bass (&lt;98 Hz)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-600"></div>
            <span className="text-gray-600">Baritone (98-130 Hz)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-indigo-600"></div>
            <span className="text-gray-600">Tenor (130-261 Hz)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-pink-600"></div>
            <span className="text-gray-600">Higher (&gt;261 Hz)</span>
          </div>
        </div>
      </div>
    </div>
  );
}