<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>战略管理驾驶舱 2.0</title>
    <!-- 核心依赖 -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        
        body {
            font-family: 'Inter', 'PingFang SC', sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            overflow-x: hidden;
        }

        /* 玻璃拟态与深度感 */
        .glass-card {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .neo-gradient {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        /* 动效 */
        @keyframes pulse-soft {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-pulse-soft {
            animation: pulse-soft 2s infinite;
        }

        .scroll-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>
    <div id="app" class="min-h-screen p-4 lg:p-8">
        <!-- 头部导航 -->
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div class="flex items-center gap-4">
                <div class="neo-gradient p-3 rounded-2xl shadow-lg shadow-blue-500/30 -rotate-6 transform hover:rotate-0 transition-transform duration-500">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <div>
                    <h1 class="text-3xl font-black tracking-tight text-white uppercase">Strategic Command <span class="text-blue-500">2.0</span></h1>
                    <p class="text-slate-500 text-sm font-medium">全校战略执行力数字管控中心</p>
                </div>
            </div>

            <div class="flex items-center gap-4 p-1.5 glass-card rounded-2xl">
                <nav class="flex gap-1">
                    <button 
                        @click="activeTab = 'all'"
                        :class="activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'"
                        class="px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300"
                    >全校概览</button>
                    <button 
                        @click="activeTab = 'dept'"
                        :class="activeTab === 'dept' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'"
                        class="px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300"
                    >部门分析</button>
                </nav>
                <div class="w-px h-6 bg-slate-700 mx-2"></div>
                <button class="relative p-2 text-slate-400 hover:text-blue-400 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 animate-ping"></span>
                </button>
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                    校
                </div>
            </div>
        </header>

        <!-- AI 智能摘要 -->
        <section class="glass-card rounded-3xl p-6 mb-10 border-l-4 border-l-blue-500 relative overflow-hidden group">
            <div class="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div class="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30">
                    <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-.992 0-1.903-.358-2.593-.952l-.547-.548z"></path></svg>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-blue-400 font-black text-xs uppercase tracking-widest">AI Intelligence Briefing</span>
                        <span class="text-slate-600 text-xs tracking-tighter">|  UPDATE: 2023.11.20 10:00</span>
                    </div>
                    <p class="text-lg text-slate-200 leading-relaxed font-medium">
                        全校战略执行总分 <span class="text-blue-400 font-black">105.8</span>。本月 <span class="text-emerald-400">“教学资源优化”</span> 模块提升显著，但 <span class="text-rose-400 underline underline-offset-4 decoration-rose-500/30">“科研产出转化率”</span> 出现季节性瓶颈，涉及 A 学院及科研处。
                        <button class="ml-2 text-blue-500 hover:text-blue-400 font-bold border-b border-blue-500/30">立即下钻诊断 &rarr;</button>
                    </p>
                </div>
                <div class="flex gap-4">
                    <div class="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div class="text-[10px] text-slate-500 uppercase font-bold">健康度</div>
                        <div class="text-xl font-black text-emerald-400">92%</div>
                    </div>
                    <div class="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div class="text-[10px] text-slate-500 uppercase font-bold">响应率</div>
                        <div class="text-xl font-black text-blue-400">1.2h</div>
                    </div>
                </div>
            </div>
            <!-- 背景纹理 -->
            <div class="absolute -right-20 -top-20 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <svg class="w-80 h-80" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9v8l10-12h-9l1-8z"></path></svg>
            </div>
        </section>

        <!-- KPI 核心矩阵 -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div v-for="(kpi, idx) in kpiCards" :key="idx" class="glass-card rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-500 group">
                <div class="flex justify-between items-start mb-6">
                    <div class="text-slate-500 text-xs font-black uppercase tracking-widest">{{ kpi.label }}</div>
                    <div :class="kpi.isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'" class="px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                        <svg v-if="kpi.isUp" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                        {{ kpi.trend }}%
                    </div>
                </div>
                <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-4xl font-black text-white tracking-tighter">{{ kpi.value }}</span>
                    <span class="text-slate-600 font-bold text-sm">{{ kpi.unit }}</span>
                </div>
                <div class="text-[11px] text-slate-500 font-medium mb-6">期末预测: <span class="text-blue-500 font-bold">{{ kpi.predict }}{{ kpi.unit }}</span> | {{ kpi.desc }}</div>
                
                <!-- 迷你进度条 -->
                <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                        :style="{ width: kpi.percent + '%' }"
                    ></div>
                </div>
            </div>
        </section>

        <!-- 中间深度图表层 -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <!-- 排名对标 -->
            <div class="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h3 class="text-xl font-black text-white italic">部门战略执行排名 <span class="text-blue-500">BENCHMARK</span></h3>
                        <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time performance vs baseline</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-blue-600/90 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20">完成率</button>
                        <button class="bg-slate-800 text-slate-400 text-[10px] font-black px-4 py-2 rounded-xl">对标值</button>
                    </div>
                </div>
                <div id="benchmarkChart" class="w-full h-[350px]"></div>
            </div>

            <!-- 雷达分析 -->
            <div class="glass-card rounded-3xl p-8">
                <div class="mb-8">
                    <h3 class="text-xl font-black text-white italic">核心维度雷达全景</h3>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Contribution dimension analysis</p>
                </div>
                <div id="radarChart" class="w-full h-[300px]"></div>
                <div class="grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-slate-700/50">
                    <div class="text-center">
                        <div class="text-[10px] text-slate-500 uppercase mb-1">平均匹配度</div>
                        <div class="text-2xl font-black text-blue-500">92.4%</div>
                    </div>
                    <div class="text-center border-l border-slate-700/50">
                        <div class="text-[10px] text-slate-500 uppercase mb-1">波动离散度</div>
                        <div class="text-2xl font-black text-rose-500">0.12</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 底部预警与行动 -->
        <section class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div class="xl:col-span-2 glass-card rounded-3xl p-8 overflow-hidden">
                <div class="flex justify-between items-center mb-8">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-rose-500/20 rounded-lg">
                            <svg class="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 class="text-xl font-black text-white italic tracking-tight">TOP 滞后任务响应清单</h3>
                    </div>
                    <button class="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">View All Issues &rarr;</button>
                </div>
                
                <div class="overflow-x-auto scroll-hide">
                    <table class="w-full">
                        <thead>
                            <tr class="text-[10px] text-slate-600 uppercase font-black tracking-widest border-b border-slate-700/50">
                                <th class="pb-4 text-left">战略任务内容</th>
                                <th class="pb-4 text-center">责任部门</th>
                                <th class="pb-4 text-center">进度状态</th>
                                <th class="pb-4 text-right">协同操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/50">
                            <tr v-for="task in tasks" :key="task.id" class="group/row hover:bg-slate-800/20 transition-colors">
                                <td class="py-5 pr-4">
                                    <div class="font-bold text-slate-200 group-hover/row:text-white">{{ task.name }}</div>
                                    <div class="text-[10px] text-slate-600 mt-1 uppercase">ID: {{ task.id }}</div>
                                </td>
                                <td class="py-5 px-4 text-center">
                                    <span class="text-slate-400 text-sm font-medium">{{ task.dept }}</span>
                                </td>
                                <td class="py-5 px-4">
                                    <div class="flex flex-col items-center">
                                        <div class="w-20 h-1.5 bg-slate-900 rounded-full mb-1 overflow-hidden p-[1px]">
                                            <div class="h-full bg-rose-500 rounded-full" :style="{ width: task.progress + '%' }"></div>
                                        </div>
                                        <span class="text-[10px] text-rose-500 font-black italic">DELAY {{ task.days }}D</span>
                                    </div>
                                </td>
                                <td class="py-5 pl-4 text-right">
                                    <button 
                                        @click="handleUrge(task)"
                                        :class="task.reminded ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105'"
                                        class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        {{ task.reminded ? '已催办' : '立即催办' }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 战略月报卡 -->
            <div class="neo-gradient rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 border border-white/10 flex flex-col">
                <div class="relative z-10">
                    <div class="flex items-center gap-2 mb-4">
                        <svg class="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.243 14.243a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM16 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z"></path></svg>
                        <h4 class="font-black text-xl italic">Executive Summary</h4>
                    </div>
                    <p class="text-blue-100/80 text-sm mb-10 font-medium">当前全校执行力综合评分处于“卓越”级，资源利用率已达到峰值，建议维持现有产出结构。</p>
                    
                    <div class="space-y-8 flex-1">
                        <div>
                            <div class="flex justify-between items-end mb-2">
                                <span class="text-[10px] uppercase font-black tracking-widest text-blue-200">预警处理时效</span>
                                <span class="text-2xl font-black italic">2.4<small class="text-xs font-normal opacity-60 ml-1">Hrs</small></span>
                            </div>
                            <div class="h-2 w-full bg-black/20 rounded-full border border-white/5 p-0.5">
                                <div class="h-full bg-white rounded-full shadow-[0_0_10px_#fff]" style="width: 88%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between items-end mb-2">
                                <span class="text-[10px] uppercase font-black tracking-widest text-blue-200">跨部门协作率</span>
                                <span class="text-2xl font-black italic">95.2<small class="text-xs font-normal opacity-60 ml-1">%</small></span>
                            </div>
                            <div class="h-2 w-full bg-black/20 rounded-full border border-white/5 p-0.5">
                                <div class="h-full bg-white rounded-full shadow-[0_0_10px_#fff]" style="width: 95%"></div>
                            </div>
                        </div>
                    </div>

                    <button class="w-full py-4 mt-12 bg-white text-blue-800 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2 group active:scale-95">
                        下载全校战略月度分析报告
                        <svg class="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </button>
                </div>
                <!-- 装饰 -->
                <div class="absolute -right-12 -bottom-12 opacity-10 rotate-12 pointer-events-none">
                    <svg class="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 13l5 5 10-10-5-5-10 10z"></path></svg>
                </div>
            </div>
        </section>

        <footer class="mt-20 pb-10 text-center opacity-30">
            <div class="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                <span>Strategic OS v2.4</span>
                <span class="w-1 h-1 bg-slate-500 rounded-full"></span>
                <span>Command Center Stable</span>
                <span class="w-1 h-1 bg-slate-500 rounded-full"></span>
                <span>© 2023 Digital Gov</span>
            </div>
        </footer>
    </div>

    <script>
        const { createApp, ref, onMounted } = Vue;

        createApp({
            setup() {
                const activeTab = ref('all');
                
                const kpiCards = ref([
                    { label: '战略执行总分', value: 105.8, unit: '分', trend: 5.2, isUp: true, predict: 112, desc: '年度目标: 120分', percent: 85 },
                    { label: '核心指标完成率', value: 78.4, unit: '%', trend: -1.2, isUp: false, predict: 92, desc: '基准线: 75%', percent: 78 },
                    { label: '严重预警任务', value: 12, unit: '项', trend: -3, isUp: false, predict: 5, desc: '平均响应: 2.4h', percent: 35 },
                    { label: '资源投入效率', value: 92, unit: '%', trend: 8.5, isUp: true, predict: 95, desc: '较上季度大幅提升', percent: 92 },
                ]);

                const tasks = ref([
                    { id: 'ST-2023-001', name: '国家级重点实验室二期建设', dept: '科研处', progress: 28, days: 15, reminded: false },
                    { id: 'ST-2023-042', name: '双一流学科评估自评报告', dept: '质量办', progress: 42, days: 8, reminded: false },
                    { id: 'ST-2023-089', name: '智慧校园二期基建招标', dept: '信息化中心', progress: 15, days: 22, reminded: false },
                ]);

                const handleUrge = (task) => {
                    if (task.reminded) return;
                    task.reminded = true;
                    // 此处可以触发后端 API
                };

                const initCharts = () => {
                    // 1. 排名图
                    const benchChart = echarts.init(document.getElementById('benchmarkChart'));
                    const benchmark = 65;
                    const benchData = [
                        { name: '软件工程', value: 85 },
                        { name: '商学院', value: 62 },
                        { name: '机械工程', value: 78 },
                        { name: '艺术设计', value: 45 },
                        { name: '外国语', value: 92 },
                        { name: '电子信息', value: 55 }
                    ];

                    benchChart.setOption({
                        backgroundColor: 'transparent',
                        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                        grid: { left: '3%', right: '5%', bottom: '5%', top: '5%', containLabel: true },
                        xAxis: { type: 'value', splitLine: { show: false }, axisLabel: { color: '#64748b' } },
                        yAxis: { 
                            type: 'category', 
                            data: benchData.map(d => d.name),
                            axisLine: { show: false },
                            axisTick: { show: false },
                            axisLabel: { color: '#cbd5e1', fontWeight: 700 }
                        },
                        series: [{
                            name: '进度',
                            type: 'bar',
                            barWidth: 14,
                            itemStyle: {
                                borderRadius: [0, 8, 8, 0],
                                color: (params) => params.value < benchmark ? '#f43f5e' : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                    { offset: 0, color: '#3b82f6' },
                                    { offset: 1, color: '#2563eb' }
                                ])
                            },
                            data: benchData.map(d => d.value),
                            markLine: {
                                symbol: 'none',
                                label: { position: 'end', formatter: '时间基准', color: '#ef4444', fontSize: 10, fontWeight: 900 },
                                lineStyle: { type: 'dashed', color: '#ef4444', width: 1.5 },
                                data: [{ xAxis: benchmark }]
                            }
                        }]
                    });

                    // 2. 雷达图
                    const radarChart = echarts.init(document.getElementById('radarChart'));
                    radarChart.setOption({
                        backgroundColor: 'transparent',
                        radar: {
                            indicator: [
                                { name: '教学质量', max: 150 },
                                { name: '科研产出', max: 150 },
                                { name: '人才引进', max: 150 },
                                { name: '社会评价', max: 150 },
                                { name: '经费使用', max: 150 }
                            ],
                            splitArea: { show: false },
                            splitLine: { lineStyle: { color: '#334155', width: 1 } },
                            axisLine: { lineStyle: { color: '#334155' } },
                            name: { textStyle: { color: '#94a3b8', fontWeight: 700, fontSize: 10 } },
                            shape: 'circle'
                        },
                        series: [{
                            type: 'radar',
                            data: [
                                {
                                    value: [110, 130, 130, 100, 90],
                                    name: '全校平均',
                                    lineStyle: { color: '#3b82f6', width: 1, type: 'dashed' },
                                    areaStyle: { color: 'rgba(59, 130, 246, 0.05)' },
                                    symbol: 'none'
                                },
                                {
                                    value: [120, 98, 86, 99, 85],
                                    name: '当前部门',
                                    lineStyle: { color: '#f43f5e', width: 2 },
                                    areaStyle: { color: 'rgba(244, 63, 94, 0.25)' },
                                    symbol: 'circle',
                                    symbolSize: 4
                                }
                            ]
                        }]
                    });

                    window.addEventListener('resize', () => {
                        benchChart.resize();
                        radarChart.resize();
                    });
                };

                onMounted(() => {
                    initCharts();
                });

                return {
                    activeTab, kpiCards, tasks, handleUrge
                };
            }
        }).mount('#app');
    </script>
</body>
</html>