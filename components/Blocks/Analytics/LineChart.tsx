import { Box, Card, Text, Title, useMantineTheme } from "@mantine/core"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { eachDayOfInterval, format, parseISO } from "date-fns"
import { formatLargeNumber } from "@/utils/format"

const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
}

function prepareDataForRecharts(data, splitBy, props, range) {
  // Create a map to hold the processed data
  // const dataMap = {}
  const output = []

  const uniqueSplitByValues =
    splitBy &&
    Array.from(new Set(data.map((item) => item[splitBy]?.toString())))

  // Initialize map with dates as keys and empty data as values
  eachDayOfInterval({
    // substract 'range' amount of days for start date
    start: new Date(new Date().getTime() - range * 24 * 60 * 60 * 1000),
    end: new Date(),
  }).forEach((day) => {
    const date = format(day, "yyyy-MM-dd")

    const dayData = { date }

    for (let prop of props) {
      if (splitBy) {
        for (let splitByValue of uniqueSplitByValues) {
          dayData[`${splitByValue} ${prop}`] =
            data.find(
              (item) =>
                item[splitBy]?.toString() === splitByValue &&
                format(parseISO(item.date), "yyyy-MM-dd") === date
            )?.[prop] || 0
        }
      } else {
        dayData[prop] =
          data.find(
            (item) => format(parseISO(item.date), "yyyy-MM-dd") === date
          )?.[prop] || 0
      }
    }

    output.push(dayData)
  })

  return output.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

const CustomizedAxisTick = ({ x, y, payload, index, data }) => {
  // Hide the first and last tick
  if (index === 0 || index === data.length - 1) {
    return null
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
        {new Date(payload.value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </text>
    </g>
  )
}

const LineChart = ({
  data,
  title,
  props,
  formatter = formatLargeNumber,
  height = 300,
  splitBy = undefined,
  range,
}) => {
  const theme = useMantineTheme()

  const colors = ["blue", "pink", "indigo", "green", "violet", "yellow"]

  const cleanedData = prepareDataForRecharts(data, splitBy, props, range)

  return (
    <Card withBorder p={0}>
      <Text c="dimmed" tt="uppercase" fw={700} fz="xs" m="md">
        {title}
      </Text>
      <Box mt="sm">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            width={500}
            height={420}
            data={cleanedData}
            margin={{
              top: 10,
              right: 0,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={({ x, y, payload, index }) => (
                <CustomizedAxisTick
                  x={x}
                  y={y}
                  payload={payload}
                  index={index}
                  data={cleanedData}
                />
              )}
              style={{
                marginLeft: 20,
              }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
              minTickGap={10}
              max={5}
            />

            <Tooltip
              formatter={formatter}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Card shadow="md" withBorder>
                      <Title order={3} size="sm">
                        {formatDate(label)}
                      </Title>
                      {payload.map((item, i) => (
                        <Text key={i}>{`${item.name}: ${formatter(
                          item.value
                        )}`}</Text>
                      ))}
                    </Card>
                  )
                }

                return null
              }}
            />

            {Object.keys(cleanedData[0])
              .filter((prop) => prop !== "date")
              .map((prop, i) => (
                <>
                  <defs key={prop}>
                    <linearGradient
                      color={theme.colors[colors[i % colors.length]][6]}
                      id={slugify(prop)}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="currentColor"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="currentColor"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    color={theme.colors[colors[i % colors.length]][4]}
                    dataKey={prop}
                    stackId="1"
                    stroke="currentColor"
                    dot={false}
                    fill={`url(#${slugify(prop)})`}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </>
              ))}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}

export default LineChart
