<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  basicScore: number
  developmentScore: number
  maxBasicScore?: number
  maxDevelopmentScore?: number
}>(), {
  maxBasicScore: 100,
  maxDevelopmentScore: 20
})

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      const max = params.name === '基础性指标' ? props.maxBasicScore : props.maxDevelopmentScore
      return `${params.name}<br/>得分: ${params.value}分 / ${max}分<br/>占比: ${params.percent}%`
    }
  },
  legend: {
    orient: 'horizontal',
    bottom: 0,
    itemWidth: 12,
    itemHeight: 12,
    textStyle: { fontSize: 12 }
  },
  series: [
    {
      name: '得分构成',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'center',
        formatter: () => {
          const total = props.basicScore + props.developmentScore
          return `{value|${total}}\n{label|总分}`
        },
        rich: {
          value: { fontSize: 24, fontWeight: 'bold', color: '#303133' },
          label: { fontSize: 12, color: '#909399', padding: [4, 0, 0, 0] }
        }
      },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: [
        { value: props.basicScore, name: '基础性指标', itemStyle: { color: '#409EFF' } },
        { value: props.developmentScore, name: '发展性指标', itemStyle: { color: '#67C23A' } }
      ],
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: () => Math.random() * 200
    }
  ]
}))
</script>

<template>
  <div class="score-composition-chart">
    <v-chart :option="chartOption" autoresize style="height: 240px" />
  </div>
</template>

<style scoped>
.score-composition-chart {
  width: 100%;
}
</style>
