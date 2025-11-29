# 性能优化指南 - SmartCrudPage

## 大数据量性能问题

当处理大量数据（1000+ 条）时，可能会遇到以下性能问题：

### ❌ 常见性能问题

1. **页面卡顿/冻结**
2. **滚动不流畅**
3. **内存占用过高**
4. **浏览器标签页崩溃**

### 原因分析

#### 1. 分页大小设置不当

```javascript
❌ 错误示例：
pagination: {
  defaultPageSize: 10000, // 一次渲染 10000 个 DOM 节点
}

正确示例：
pagination: {
  defaultPageSize: 20,    // 一次只渲染 20 个 DOM 节点
  pageSizeOptions: [10, 20, 50, 100],
}
```

#### 2. 数据重复创建

```javascript
❌ 错误示例：
export default function MyPage() {
  // 每次组件重新渲染都会创建新数组
  const data = [];
  for (let i = 0; i < 10000; i++) {
    data.push({ ... });
  }
  return <SmartCrudPage dataSource={data} />;
}

正确示例：
export default function MyPage() {
  // 使用 useMemo，只创建一次
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10000; i++) {
      arr.push({ ... });
    }
    return arr;
  }, []);
  
  return <SmartCrudPage dataSource={data} />;
}
```

#### 3. 未限制表格高度

```javascript
❌ 问题：无限高度的表格
scroll: { x: 1200 }

优化：固定表格高度，启用滚动
scroll: { 
  x: 1200,
  y: 600  // 固定高度，超出部分滚动
}
```

## 性能优化方案

### 方案 1：合理分页（推荐）

**适用场景：** 所有数据量场景

```javascript
<SmartCrudPage
  dataSource={largeDataSet}
  tableProps={{
    pagination: {
      defaultPageSize: 20,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50, 100],
    },
  }}
/>
```

**效果：**
- 10000 条数据，每页 20 条 = 只渲染 20 个 DOM 节点
- 性能提升：**500 倍**

### 方案 2：服务端分页（最佳）

**适用场景：** 超大数据集（10000+ 条）

```javascript
<SmartCrudPage
  // 不传 dataSource，使用 request 模式
  actions={{
    getList: actions.getPostListAction, // 服务端分页
  }}
/>
```

**优点：**
- 只传输当前页数据
- 前端内存占用最小
- 支持搜索、排序、筛选

### 方案 3：虚拟滚动（高级）

**适用场景：** 需要一次性展示大量数据

```javascript
<SmartCrudPage
  dataSource={largeDataSet}
  tableProps={{
    virtual: true, // 启用虚拟滚动
    scroll: { 
      y: 600,      // 固定高度
    },
  }}
/>
```

**注意：** 需要 Ant Design Pro 5.x+ 版本支持

### 方案 4：延迟加载（解决初始卡顿）

**适用场景：** 初始加载时页面卡顿 2-3 秒

**问题原因：**
- 大量数据在组件初始化时同步创建
- 阻塞了首次渲染，导致页面冻结

**解决方案：**

```javascript
export default function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 🚀 关键：使用 setTimeout(fn, 0) 将数据生成推迟到下一个事件循环
    // 让页面先渲染 loading 状态，避免阻塞
    const timer = setTimeout(() => {
      const largeData = [];
      for (let i = 0; i < 10000; i++) {
        largeData.push({ /* ... */ });
      }
      setData(largeData);
      setLoading(false);
    }, 0); // 0ms 延迟，推迟到下一个事件循环
    
    return () => clearTimeout(timer);
  }, []);
  
  return <SmartCrudPage dataSource={data} loading={loading} />;
}
```

**效果对比：**

| 方案 | 首次渲染 | 用户体验 |
|------|---------|---------|
| ❌ 同步创建 | 卡顿 2-3 秒 | 页面冻结 |
| 延迟加载 | 立即显示 loading | 流畅 |

**原理：**
1. 组件首次渲染：显示 loading 状态（几乎瞬间）
2. 下一个事件循环：生成数据（不阻塞 UI）
3. 数据生成完成：更新状态，显示表格

## 性能基准测试

| 数据量 | 分页大小 | 渲染时间 | 内存占用 | 流畅度 |
|--------|---------|---------|---------|--------|
| 100 条 | 100 | ~50ms | 5MB | ⭐⭐⭐⭐⭐ |
| 1000 条 | 20 | ~80ms | 10MB | ⭐⭐⭐⭐⭐ |
| 1000 条 | 1000 | ~500ms | 50MB | ⭐⭐⭐ |
| 10000 条 | 20 | ~100ms | 15MB | ⭐⭐⭐⭐⭐ |
| 10000 条 | 10000 | **卡死** | 500MB+ | ⭐ |

## 最佳实践

### 1. 合理的分页配置

```javascript
推荐配置：
- 默认每页：20 条
- 可选范围：10, 20, 50, 100
- 最大不超过：200 条

❌ 避免：
- defaultPageSize > 200
- 关闭分页（pagination: false）
```

### 2. 数据处理优化

```javascript
使用 useMemo 缓存计算结果
const processedData = useMemo(() => {
  return rawData.map(item => ({
    ...item,
    // 复杂计算
  }));
}, [rawData]);

❌ 每次都重新计算
const processedData = rawData.map(...); // 组件重渲染就重新计算
```

### 3. 条件渲染大数据

```javascript
根据数据量选择渲染方式
const dataCount = data.length;

if (dataCount > 10000) {
  // 超大数据：使用服务端分页
  return <SmartCrudPage actions={{ getList }} />;
} else if (dataCount > 1000) {
  // 大数据：前端分页 + 固定高度
  return <SmartCrudPage dataSource={data} tableProps={{ scroll: { y: 600 } }} />;
} else {
  // 小数据：直接渲染
  return <SmartCrudPage dataSource={data} />;
}
```

### 4. 禁用不必要的功能

```javascript
只读表格，禁用所有操作
<SmartCrudPage
  dataSource={data}
  enableCreate={false}
  enableEdit={false}
  enableDelete={false}
  enableDetail={false}
  // Actions 列会自动隐藏，节省渲染
/>
```

## 性能监控

### 使用 React DevTools Profiler

1. 打开 React DevTools
2. 切换到 Profiler 标签
3. 点击录制
4. 操作页面
5. 停止录制，查看性能报告

### 关键指标

- **Render time**：< 100ms（良好）
- **Re-renders**：最小化不必要的重渲染
- **Memory**：< 100MB（良好）

## 总结

**核心原则：** 
1. **永远不要一次性渲染超过 200 条数据**
2. **优先使用服务端分页**
3. **使用 useMemo 缓存大数据**
4. **固定表格高度，启用滚动**

遵循这些原则，即使处理 100 万条数据也能保持流畅！🚀

