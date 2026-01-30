'use client'

interface GeneratingIndicatorProps {
  fileCount: number
}

export function GeneratingIndicator({ fileCount }: GeneratingIndicatorProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl border-b-2 border-blue-400 animate-pulse">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 旋转的加载图标 - 双重旋转效果 */}
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
            <div 
              className="absolute inset-0 w-7 h-7 border-[3px] border-blue-200 border-r-transparent rounded-full animate-spin" 
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
            {/* 中心点 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* 文字提示 */}
          <div className="flex flex-col">
            <span className="text-white font-bold text-base flex items-center gap-2">
              <span className="animate-bounce">⚡</span>
              <span className="animate-pulse">正在生成代码中...</span>
            </span>
            <span className="text-blue-100 text-xs mt-1 font-medium">
              已生成 <span className="font-bold text-white bg-blue-700/50 px-1.5 py-0.5 rounded">{fileCount}</span> 个文件 • 请耐心等待
            </span>
          </div>
        </div>

        {/* 警告提示 - 更醒目的闪烁效果 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/40 border-2 border-yellow-400/70 rounded-lg shadow-lg animate-pulse">
          <span className="text-yellow-100 text-sm font-bold flex items-center gap-1.5">
            <span className="text-lg animate-bounce">⚠️</span>
            <span>请勿刷新页面</span>
          </span>
        </div>
      </div>
      
      {/* 进度条动画 */}
      <div className="h-1.5 bg-blue-400/20 overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-transparent via-white/80 to-transparent absolute top-0 left-0"
          style={{
            width: '33%',
            animation: 'shimmer 2s infinite'
          }}
        ></div>
      </div>
    </div>
  )
}
