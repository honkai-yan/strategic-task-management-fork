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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        
        body {
            font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background-color: #0b1120;
            color: #f1f5f9;
            overflow-x: hidden;
        }

        /* 深度玻璃拟态效果 */
        .glass-card {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .glass-card:hover {
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.4);
        }

        .neo-gradient {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
        }

        /* 滚动条美化 */
        .scroll-hide::-webkit-scrollbar {
            width: 4px;
        }
        .scroll-hide::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        .scroll-hide::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.3);
            border-radius: 10px;
        }

        /* 动画增强 */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
    </style>
</head>
<body>
    <div id="app" class="min-h-screen p-4 lg:p-10 max-w-[1600px] mx-auto">
        <!-- 头部导航 -->
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 animate-fade-in">
            <div class="flex items-center gap-5">
                <div class="neo-gradient p-3.5 rounded-2xl shadow-xl shadow-blue-500/20 -rotate-3 transform hover:rotate-0 transition-all duration-500 cursor-pointer">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <div>
                    <h1 class="text-3xl font-black tracking-tight text-white uppercase leading-none mb-2">Strategic Command <span class="text-blue-500">2.0</span></h1>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p class="text-slate-400 text-sm font-semibold tracking-wide">全校战略执行力数字管控中心</p>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4 p-1.5 glass-card rounded-2xl">
                <nav class="flex gap-1">
                    <button 
                        @click="activeTab = 'all'"
                        :class="activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'"
                        class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                    >全校概览</button>
                    <button 
                        @click="activeTab = 'dept'"
                        :class="activeTab === 'dept' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'"
                        class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                    >部门分析</button>
                </nav>
                <div class="w-px h-6 bg-slate-700/50 mx-2"></div>
                <div class="flex items-center gap-3 pr-2">
                    <button class="relative p-2.5 text-slate-400 hover:text-blue-400 transition-colors bg-slate-800/40 rounded-xl">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0b1120] animate-ping"></span>
                    </button>
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-white/10">
                        校
                    </div>
                </div>
            </div>
        </header>

        <!-- AI 智能摘要 -->
        <section class="glass-card rounded-3xl p-8 mb-10 border-l-[6px] border-l-blue-500 relative overflow-hidden group animate-fade-in" style="animation-delay: 0.1s">
            <div class="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                <div class="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20 shadow-inner">
                    <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-.992 0-1.903-.358-2.593-.952l-.547-.548z"></path></svg>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">AI Intelligence Briefing</span>
                        <div class="h-px flex-1 bg-slate-700/50"></div>
                        <span class="text-slate-500 text-xs font-mono tracking-tight">DATA SYNC: 2023.11.20 10:00</span>
                    </div>
                    <p class="text-xl text-slate-100 leading-relaxed font-semibold">
                        本期战略执行总分 <span class="text-blue-500 font-black border-b-2 border-blue-500/30">105.8</span>。
                        <span class="text-emerald-400">“人才引进”</span> 与 <span class="text-emerald-400">“教学优化”</span> 指标表现亮眼，
                        但受季节性因素影响，<span class="text-rose-500 underline underline-offset-8 decoration-rose-500/40 font-bold italic">“科研成果转化”</span> 板块出现阻塞。
                        <button class="ml-3 text-blue-400 hover:text-blue-300 font-bold transition-all group/btn flex-inline items-center">
                            查看归因建议 <span class="inline-block group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                        </button>
                    </p>
                </div>
                <div class="flex gap-5 self-stretch lg:self-center">
                    <div class="flex-1 lg:flex-none px-6 py-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-center">
                        <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">健康指数</div>
                        <div class="text-2xl font-black text-emerald-500">92%</div>
                    </div>
                    <div class="flex-1 lg:flex-none px-6 py-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-center">
                        <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">响应能效</div>
                        <div class="text-2xl font-black text-blue-500">1.2h</div>
                    </div>
                </div>
            </div>
            <!-- 背景纹理装饰 -->
            <div class="absolute -right-16 -top-16 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 pointer-events-none rotate-12 group-hover:rotate-0">
                <svg class="w-96 h-96" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9v8l10-12h-9l1-8z"></path></svg>
            </div>
        </section>

        <!-- KPI 核心矩阵 -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in" style="animation-delay: 0.2s">
            <div v-for="(kpi, idx) in kpiCards" :key="idx" class="glass-card rounded-[2rem] p-7 hover:border-blue-500/40 transition-all duration-500 group relative">
                <div class="flex justify-between items-start mb-8">
                    <div class="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">{{ kpi.label }}</div>
                    <div :class="kpi.isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-500 bg-rose-500/10'" class="px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-colors">
                        <svg v-if="kpi.isUp" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                        {{ kpi.trend }}%
                    </div>
                </div>
                <div class="flex items-baseline gap-2 mb-2">
                    <span class="text-5xl font-black text-white tracking-tighter">{{ kpi.value }}</span>
                    <span class="text-slate-500 font-bold text-sm uppercase tracking-widest">{{ kpi.unit }}</span>
                </div>
                <div class="text-[11px] text-slate-500 font-semibold mb-8 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                    期末预测: <span class="text-blue-400 font-bold">{{ kpi.predict }}{{ kpi.unit }}</span>
                </div>
                
                <!-- 现代化进度条 -->
                <div class="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                    <div 
                        class="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out"
                        :style="{ width: kpi.percent + '%' }"
                    ></div>
                </div>
                <!-- 卡片内部装饰 -->
                <div class="absolute bottom-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <svg class="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"></path></svg>
                </div>
            </div>
        </section>

        <!-- 中间深度图表层 -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-fade-in" style="animation-delay: 0.3s">
            <!-- 排名对标 -->
            <div class="lg:col-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h3 class="text-2xl font-black text-white italic tracking-tight flex items-center gap-3">
                            <span class="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                            部门执行基准对标 <span class="text-blue-500 font-black">BENCHMARK</span>
                        </h3>
                        <p class="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Real-time performance vs baseline metrics</p>
                    </div>
                    <div class="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
                        <button class="bg-blue-600 text-white text-[10px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all">完成率</button>
                        <button class="text-slate-500 hover:text-slate-200 text-[10px] font-black px-5 py-2.5 rounded-xl transition-all">对标值</button>
                    </div>
                </div>
                <div id="benchmarkChart" class="w-full h-[380px]"></div>
            </div>

            <!-- 雷达分析 -->
            <div class="glass-card rounded-[2.5rem] p-10 flex flex-col">
                <div class="mb-10">
                    <h3 class="text-2xl font-black text-white italic tracking-tight">维度协同雷达</h3>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Strategic dimension synergy</p>
                </div>
                <div id="radarChart" class="w-full flex-1 min-h-[300px]"></div>
                <div class="grid grid-cols-2 gap-6 mt-6 pt-8 border-t border-slate-700/40">
                    <div class="text-center">
                        <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">协同匹配度</div>
                        <div class="text-3xl font-black text-blue-500 tabular-nums">92.4%</div>
                    </div>
                    <div class="text-center border-l border-slate-700/40">
                        <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">离散风险</div>
                        <div class="text-3xl font-black text-rose-500 tabular-nums">0.12</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 底部预警与行动 -->
        <section class="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in" style="animation-delay: 0.4s">
            <div class="xl:col-span-2 glass-card rounded-[2.5rem] p-10 overflow-hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-rose-500/15 rounded-2xl border border-rose-500/20">
                            <svg class="w-7 h-7 text-rose-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div>
                            <h3 class="text-2xl font-black text-white italic tracking-tight">TOP 滞后任务响应清单</h3>
                            <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">High priority pending actions</p>
                        </div>
                    </div>
                    <button class="text-xs font-black text-blue-500 hover:text-blue-400 transition-all uppercase tracking-[0.2em] px-4 py-2 hover:bg-blue-500/5 rounded-xl">
                        View All Issues &rarr;
                    </button>
                </div>
                
                <div class="overflow-x-auto scroll-hide">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] border-b border-slate-700/50">
                                <th class="pb-6 text-left pl-2">战略任务内容</th>
                                <th class="pb-6 text-center">责任主体</th>
                                <th class="pb-6 text-center">当前进度</th>
                                <th class="pb-6 text-right pr-2">闭环管理</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/40">
                            <tr v-for="task in tasks" :key="task.id" class="group/row hover:bg-slate-800/30 transition-all">
                                <td class="py-6 pr-4 pl-2">
                                    <div class="font-bold text-slate-100 group-hover/row:text-blue-400 transition-colors">{{ task.name }}</div>
                                    <div class="text-[10px] text-slate-600 mt-2 font-mono uppercase tracking-tighter">REF_ID: {{ task.id }}</div>
                                </td>
                                <td class="py-6 px-4 text-center">
                                    <span class="px-3 py-1 bg-slate-800/60 rounded-lg text-slate-400 font-bold border border-slate-700/50">{{ task.dept }}</span>
                                </td>
                                <td class="py-6 px-4">
                                    <div class="flex flex-col items-center gap-2">
                                        <div class="w-24 h-2 bg-slate-900/80 rounded-full border border-white/5 overflow-hidden shadow-inner">
                                            <div class="h-full bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" :style="{ width: task.progress + '%' }"></div>
                                        </div>
                                        <span class="text-[11px] text-rose-500 font-black italic tracking-wide">DELAYED {{ task.days }}D</span>
                                    </div>
                                </td>
                                <td class="py-6 pl-4 text-right pr-2">
                                    <button 
                                        @click="handleUrge(task)"
                                        :disabled="task.reminded"
                                        :class="task.reminded ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed opacity-50' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-95 hover:shadow-blue-500/40'"
                                        class="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        {{ task.reminded ? '已下达指令' : '一键催办' }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 战略月报卡 -->
            <div class="neo-gradient rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/40 border border-white/10 flex flex-col group">
                <div class="relative z-10 flex flex-col h-full">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="p-2 bg-white/20 rounded-xl">
                            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.243 14.243a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM16 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z"></path></svg>
                        </div>
                        <h4 class="font-black text-2xl italic tracking-tight uppercase">Decision Intelligence</h4>
                    </div>
                    <p class="text-blue-100/90 text-base mb-12 font-semibold leading-relaxed">当前执行效能评定为 <span class="bg-white/20 px-2 py-0.5 rounded text-white italic font-black">EXCELLENT</span> 级。系统建议维持现有资源倾斜结构，并关注科研板块瓶颈。</p>
                    
                    <div class="space-y-10 flex-1">
                        <div>
                            <div class="flex justify-between items-end mb-3">
                                <span class="text-[10px] uppercase font-black tracking-widest text-blue-100">预警处置均效</span>
                                <span class="text-3xl font-black italic tabular-nums">2.4<small class="text-xs font-normal opacity-70 ml-1 tracking-widest uppercase">Hrs</small></span>
                            </div>
                            <div class="h-2 w-full bg-black/25 rounded-full border border-white/10 p-0.5 overflow-hidden">
                                <div class="h-full bg-white rounded-full shadow-[0_0_15px_#fff]" style="width: 88%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between items-end mb-3">
                                <span class="text-[10px] uppercase font-black tracking-widest text-blue-100">组织协同系数</span>
                                <span class="text-3xl font-black italic tabular-nums">95.2<small class="text-xs font-normal opacity-70 ml-1 tracking-widest uppercase">%</small></span>
                            </div>
                            <div class="h-2 w-full bg-black/25 rounded-full border border-white/10 p-0.5 overflow-hidden">
                                <div class="h-full bg-white rounded-full shadow-[0_0_15px_#fff]" style="width: 95%"></div>
                            </div>
                        </div>
                    </div>

                    <button class="w-full py-5 mt-12 bg-white text-blue-700 rounded-3xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-3 group/report active:scale-95">
                        全校战略月度分析报告 (PDF)
                        <svg class="w-5 h-5 group-hover/report:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </button>
                </div>
                <!-- 装饰背景图标 -->
                <div class="absolute -right-16 -bottom-16 opacity-[0.08] rotate-12 pointer-events-none group-hover:rotate-0 transition-all duration-1000">
                    <svg class="w-80 h-80 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 13l5 5 10-10-5-5-10 10z"></path></svg>
                </div>
            </div>
        </section>

        <footer class="mt-24 pb-12 text-center opacity-30 select-none">
            <div class="flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                <span>Strategic Command OS v2.4</span>
                <span class="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <span>Command Center Stable</span>
                <span class="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <span>© 2023 Digital Gov Command</span>
            </div>
        </footer>
    </div>

    <script>
        const { createApp, ref, onMounted } = Vue;

        createApp({
            setup() {
                const activeTab = ref('all');
                
                const kpiCards = ref([
                    { label: '战略执行总分', value: 105.8, unit: 'PTS', trend: 5.2, isUp: true, predict: 112, desc: '年度目标: 120 PTS', percent: 85 },
                    { label: '核心指标完成率', value: 78.4, unit: '%', trend: -1.2, isUp: false, predict: 92, desc: '全校基准: 75%', percent: 78 },
                    { label: '严重预警任务', value: 12, unit: 'QTY', trend: -3, isUp: false, predict: 5, desc: '响应均时: 2.4h', percent: 35 },
                    { label: '资源利用效率', value: 92, unit: '%', trend: 8.5, isUp: true, predict: 95, desc: '较上期显著提升', percent: 92 },
                ]);

                const tasks = ref([
                    { id: 'ST-2023-001', name: '国家级重点实验室二期建设', dept: '科研处', progress: 28, days: 15, reminded: false },
                    { id: 'ST-2023-042', name: '双一流学科评估自评报告', dept: '质量办', progress: 42, days: 8, reminded: false },
                    { id: 'ST-2023-089', name: '智慧校园二期基建招标', dept: '信息化中心', progress: 15, days: 22, reminded: false },
                ]);

                const handleUrge = (task) => {
                    if (task.reminded) return;
                    task.reminded = true;
                };

                const initCharts = () => {
                    // 1. 排名图
                    const benchChart = echarts.init(document.getElementById('benchmarkChart'));
                    const benchmarkValue = 65;
                    const benchData = [
                        { name: '软件工程学院', value: 85 },
                        { name: '商学院', value: 62 },
                        { name: '机械工程学院', value: 78 },
                        { name: '艺术设计学院', value: 45 },
                        { name: '外国语学院', value: 92 },
                        { name: '电子信息中心', value: 55 }
                    ];

                    benchChart.setOption({
                        backgroundColor: 'transparent',
                        tooltip: { 
                            trigger: 'axis', 
                            axisPointer: { type: 'shadow' },
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: 'rgba(59, 130, 246, 0.5)',
                            textStyle: { color: '#fff' }
                        },
                        grid: { left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
                        xAxis: { 
                            type: 'value', 
                            max: 100,
                            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }, 
                            axisLabel: { color: '#64748b', fontWeight: 'bold' } 
                        },
                        yAxis: { 
                            type: 'category', 
                            data: benchData.map(d => d.name),
                            axisLine: { show: false },
                            axisTick: { show: false },
                            axisLabel: { color: '#cbd5e1', fontWeight: 800, fontSize: 12 }
                        },
                        series: [{
                            name: '进度',
                            type: 'bar',
                            barWidth: 16,
                            itemStyle: {
                                borderRadius: [0, 8, 8, 0],
                                color: (params) => {
                                    if (params.value < benchmarkValue) {
                                        return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                            { offset: 0, color: '#f43f5e' },
                                            { offset: 1, color: '#fb7185' }
                                        ]);
                                    }
                                    return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                        { offset: 0, color: '#3b82f6' },
                                        { offset: 1, color: '#60a5fa' }
                                    ]);
                                }
                            },
                            data: benchData.map(d => d.value),
                            markLine: {
                                symbol: 'none',
                                label: { position: 'end', formatter: '时间基准', color: '#f43f5e', fontSize: 10, fontWeight: 900, backgroundColor: 'rgba(244,63,94,0.1)', padding: [4, 8], borderRadius: 4 },
                                lineStyle: { type: 'dashed', color: '#f43f5e', width: 2, opacity: 0.6 },
                                data: [{ xAxis: benchmarkValue }]
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
                                { name: '经费效能', max: 150 }
                            ],
                            splitArea: { show: false },
                            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', width: 1 } },
                            axisLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } },
                            name: { textStyle: { color: '#94a3b8', fontWeight: 700, fontSize: 11, padding: [3, 5] } },
                            shape: 'circle',
                            center: ['50%', '50%'],
                            radius: '70%'
                        },
                        series: [{
                            type: 'radar',
                            data: [
                                {
                                    value: [110, 130, 130, 100, 90],
                                    name: '全校基准',
                                    lineStyle: { color: '#3b82f6', width: 1, type: 'dashed', opacity: 0.4 },
                                    areaStyle: { color: 'rgba(59, 130, 246, 0.05)' },
                                    symbol: 'none'
                                },
                                {
                                    value: [120, 98, 86, 99, 85],
                                    name: '实时状况',
                                    lineStyle: { color: '#f43f5e', width: 3 },
                                    areaStyle: { 
                                        color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                                            { offset: 0, color: 'rgba(244, 63, 94, 0.1)' },
                                            { offset: 1, color: 'rgba(244, 63, 94, 0.4)' }
                                        ])
                                    },
                                    symbol: 'circle',
                                    symbolSize: 6,
                                    itemStyle: { color: '#f43f5e', borderWidth: 2, borderColor: '#fff' }
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