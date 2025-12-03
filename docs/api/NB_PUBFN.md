# nb.pubfn 公共函数库

<div align="center">

**参考 vk-unicloud 设计的工具函数库**

[时间处理](#-时间处理) · [数据校验](#-数据校验) · [数组操作](#-数组操作) · [树形结构](#-树形结构)

</div>

---

## 🎯 概述

`nb.pubfn` 是 NextJS Base 的公共函数库，参考 [vk-unicloud 的 pubfn API](https://vkdoc.fsq.pub/client/jsapi.html#common) 设计，提供统一的工具函数。

### 使用方式

```javascript
import nb from '@/lib/function'

// 使用示例
nb.pubfn.isNull(value)
nb.pubfn.timeFormat(new Date())
nb.pubfn.tree.arrayToTree(list)
```

---

## 📚 API 目录

| 分类 | 函数 |
|:---|:---|
| [时间处理](#-时间处理) | `timeFormat`, `getDateInfo`, `getCommonTime`, `sleep` |
| [数据校验](#-数据校验) | `isNull`, `isNotNull`, `test`, `validator` |
| [类型判断](#-类型判断) | `isArray`, `isObject`, `isString`, `getType` |
| [对象操作](#-对象操作) | `deepClone`, `getData`, `setData`, `formAssign` |
| [数组操作](#-数组操作) | `getListItem`, `arrayUnique`, `arraySort`, `groupBy` |
| [树形结构](#-树形结构) | `arrayToTree`, `treeToArray`, `mapTree`, `findInTree` |
| [字符串处理](#-字符串处理) | `hidden`, `random`, `trim`, `truncate` |
| [编码转换](#-编码转换) | `uuid`, `encodeBase64`, `parseJSON` |
| [数学计算](#-数学计算) | `formatMoney`, `priceFilter`, `toDecimal` |
| [函数工具](#-函数工具) | `debounce`, `throttle`, `batchRun` |

---

## ⏰ 时间处理

### timeFormat - 日期格式化

```javascript
nb.pubfn.timeFormat(date, format, targetTimezone)
```

| 参数 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `date` | Date/Number/String | - | 日期对象、时间戳或字符串 |
| `format` | String | `'yyyy-MM-dd hh:mm:ss'` | 格式化模板 |
| `targetTimezone` | Number | `8` | 目标时区 |

**格式化占位符**：`yyyy`(年), `MM`(月), `dd`(日), `hh`(时), `mm`(分), `ss`(秒), `S`(毫秒)

```javascript
nb.pubfn.timeFormat(new Date(), 'yyyy-MM-dd')
// "2025-12-03"

nb.pubfn.timeFormat(1733136000000, 'yyyy年MM月dd日 hh:mm')
// "2025年12月02日 18:00"
```

### getDateInfo - 解析日期

```javascript
const info = nb.pubfn.getDateInfo(new Date())
// { year: 2025, month: 12, day: 3, hour: 10, minute: 30, second: 0, week: 3, quarter: 4 }
```

### getCommonTime - 常用时间范围

```javascript
const time = nb.pubfn.getCommonTime()
// { todayStart, todayEnd, monthStart, monthEnd, yearStart, yearEnd, weekStart, weekEnd, now }
```

### sleep - 休眠等待

```javascript
await nb.pubfn.sleep(1000)  // 等待 1 秒
```

---

## ✅ 数据校验

### isNull / isNotNull - 空值判断

以下值被视为空：`undefined`, `null`, `""`, `{}`, `[]`

```javascript
nb.pubfn.isNull(null)       // true
nb.pubfn.isNull('')         // true
nb.pubfn.isNull({})         // true
nb.pubfn.isNull([])         // true
nb.pubfn.isNull(0)          // false
nb.pubfn.isNotNull('hello') // true
```

### isNullOne / isNullAll / isNotNullAll - 批量判断

```javascript
nb.pubfn.isNullOne(a, b, c)     // 至少一个为空
nb.pubfn.isNullAll(a, b, c)     // 全部为空
nb.pubfn.isNotNullAll(a, b, c)  // 全部不为空
```

### test - 格式校验

| type | 说明 |
|:---|:---|
| `mobile` | 手机号 |
| `email` | 邮箱 |
| `url` | 网址 |
| `ip` | IP 地址 |
| `card` | 身份证 |
| `number` | 纯数字 |
| `chinese` | 纯中文 |
| `password` | 密码 (6-18位) |

```javascript
nb.pubfn.test('13800138000', 'mobile')  // true
nb.pubfn.test('test@example.com', 'email')  // true
```

---

## 🔍 类型判断

```javascript
nb.pubfn.isArray([1, 2, 3])      // true
nb.pubfn.isObject({ a: 1 })      // true
nb.pubfn.isString('hello')       // true
nb.pubfn.isNumber(123)           // true
nb.pubfn.isFunction(() => {})    // true
nb.pubfn.isDate(new Date())      // true

nb.pubfn.getType([])             // 'array'
nb.pubfn.getType({})             // 'object'
nb.pubfn.getType(null)           // 'null'
```

---

## 📦 对象操作

### deepClone - 深度克隆

```javascript
const newObj = nb.pubfn.deepClone(obj)
```

### getData / setData - 路径取值/设值

```javascript
const obj = { a: { b: { c: 1 } } }

nb.pubfn.getData(obj, 'a.b.c')           // 1
nb.pubfn.getData(obj, 'a.b.d', 'default') // 'default'

nb.pubfn.setData(obj, 'a.b.c', 2)
nb.pubfn.setData(obj, 'x.y.z', 3)  // 自动创建路径
```

### formAssign - 表单数据填充

```javascript
const defaultData = { name: '', age: 0, enable: true }
const itemData = { name: '张三', age: 25 }

const formData = nb.pubfn.formAssign(defaultData, itemData)
// { name: '张三', age: 25, enable: true }
```

### getNewObject / deleteObjectKeys

```javascript
const obj = { id: 1, name: '张三', password: '123' }

nb.pubfn.getNewObject(obj, ['id', 'name'])  // { id: 1, name: '张三' }
nb.pubfn.deleteObjectKeys(obj, ['password']) // { id: 1, name: '张三' }
```

---

## 📋 数组操作

### getListItem - 获取数组中的对象

```javascript
const list = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
]

nb.pubfn.getListItem(list, 'id', 2)  // { id: 2, name: '李四' }
nb.pubfn.getListIndex(list, 'id', 2) // 1
```

### arrayToJson - 数组转对象

```javascript
const list = [
  { id: 'a', name: '张三' },
  { id: 'b', name: '李四' }
]

nb.pubfn.arrayToJson(list, 'id')
// { a: { id: 'a', name: '张三' }, b: { id: 'b', name: '李四' } }
```

### arrayObjectGetArray - 提取字段

```javascript
nb.pubfn.arrayObjectGetArray(list, 'id')  // ['a', 'b']
```

### arrayUnique - 数组去重

```javascript
nb.pubfn.arrayUnique([1, 2, 2, 3])  // [1, 2, 3]
nb.pubfn.arrayUnique([{id:1},{id:2},{id:1}], 'id')  // [{id:1},{id:2}]
```

### arraySort - 数组排序

```javascript
nb.pubfn.arraySort([3, 1, 2])  // [1, 2, 3]
nb.pubfn.arraySort([{age:30},{age:20}], 'age', 'desc')  // [{age:30},{age:20}]
```

### arrayDiff / arrayIntersect / arrayUnion - 集合运算

```javascript
nb.pubfn.arrayDiff([1,2,3], [2,3,4])       // [1] (差集)
nb.pubfn.arrayIntersect([1,2,3], [2,3,4])  // [2,3] (交集)
nb.pubfn.arrayUnion([1,2,3], [2,3,4])      // [1,2,3,4] (并集)
```

### groupBy - 分组

```javascript
const list = [
  {type:'a', v:1},
  {type:'b', v:2},
  {type:'a', v:3}
]
nb.pubfn.groupBy(list, 'type')
// { a: [{type:'a',v:1},{type:'a',v:3}], b: [{type:'b',v:2}] }
```

### sum / average / max / min - 统计

```javascript
nb.pubfn.sum([1, 2, 3])       // 6
nb.pubfn.average([1, 2, 3])   // 2
nb.pubfn.max([1, 2, 3])       // 3
nb.pubfn.min([1, 2, 3])       // 1

nb.pubfn.sum([{v:1},{v:2}], 'v')  // 3
```

### shuffle / sample - 随机

```javascript
nb.pubfn.shuffle([1, 2, 3, 4, 5])      // 随机打乱
nb.pubfn.sample([1, 2, 3, 4, 5])       // 随机取一个
nb.pubfn.sampleSize([1, 2, 3, 4, 5], 3) // 随机取3个
```

---

## 🌳 树形结构

所有树形工具在 `nb.pubfn.tree` 下。

### arrayToTree - 数组转树

```javascript
nb.pubfn.tree.arrayToTree(arr, options)
```

| 参数 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `id` | String | `'id'` | 主键字段 |
| `parentId` | String | `'parentId'` | 父级字段 |
| `children` | String | `'children'` | 子节点字段 |
| `rootParentId` | any | `null` | 根节点 parentId |
| `filter` | Function | - | 过滤函数 |
| `sortBy` | Array | - | 排序配置 |

```javascript
const list = [
  { id: 1, parentId: null, name: '系统管理' },
  { id: 2, parentId: 1, name: '用户管理' },
  { id: 3, parentId: 1, name: '角色管理' },
]

const tree = nb.pubfn.tree.arrayToTree(list, {
  filter: (item) => item.enable !== false,
  sortBy: [{ field: 'sort', order: 'asc' }]
})
```

### treeToArray - 树转数组

```javascript
nb.pubfn.tree.treeToArray(tree, { addLevel: true })
// [{ id: 1, name: 'A', level: 0 }, { id: 2, name: 'B', level: 1 }, ...]
```

### mapTree - 映射树

```javascript
const selectTree = nb.pubfn.tree.mapTree(menuTree, (node) => ({
  title: node.name,
  value: node.id,
  key: node.id,
}))
```

### findInTree - 查找节点

```javascript
const node = nb.pubfn.tree.findInTree(tree, (item) => item.id === 'menu-1')
```

### filterTree - 过滤树

```javascript
const filtered = nb.pubfn.tree.filterTree(tree, (item) => 
  item.name.includes('用户')
)
```

### getLeaves - 获取叶子节点

```javascript
const leaves = nb.pubfn.tree.getLeaves(tree)
```

---

## 📝 字符串处理

### hidden - 隐藏中间字符

```javascript
nb.pubfn.hidden('13800138000', 3, 4)  // '138****8000'
```

### random - 随机字符串

```javascript
nb.pubfn.random(6)                // '123456' (纯数字)
nb.pubfn.random(8, 'a-z,0-9')     // 'a1b2c3d4'
nb.pubfn.random(10, 'a-z,A-Z,0-9') // 'aB1cD2eF3g'
```

### trim / truncate

```javascript
nb.pubfn.trim('  hello  ')         // 'hello'
nb.pubfn.truncate('hello world', 8) // 'hello...'
```

### capitalize / uncapitalize

```javascript
nb.pubfn.capitalize('hello')    // 'Hello'
nb.pubfn.uncapitalize('Hello')  // 'hello'
```

---

## 🔐 编码转换

### uuid / shortUuid

```javascript
nb.pubfn.uuid()       // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
nb.pubfn.shortUuid()  // 'a1b2c3d4' (8位)
```

### encodeBase64 / decodeBase64

```javascript
nb.pubfn.encodeBase64('hello')     // 'aGVsbG8='
nb.pubfn.decodeBase64('aGVsbG8=')  // 'hello'
```

### parseJSON / stringifyJSON

```javascript
nb.pubfn.parseJSON('{"a":1}')      // { a: 1 }
nb.pubfn.parseJSON('invalid', {})  // {} (解析失败返回默认值)
```

---

## 💰 数学计算

### formatMoney - 千分位格式化

```javascript
nb.pubfn.formatMoney(1234567.89)     // '1,234,567.89'
nb.pubfn.formatMoney(1234567.89, 0)  // '1,234,568'
```

### priceFilter - 分转元

```javascript
nb.pubfn.priceFilter(100)   // '1.00'
nb.pubfn.priceFilter(1234)  // '12.34'
```

### toDecimal - 保留小数

```javascript
nb.pubfn.toDecimal(1.56555, 2)  // 1.57
```

---

## 🔧 函数工具

### debounce - 防抖

```javascript
nb.pubfn.debounce(() => {
  // 执行搜索
}, 300)
```

### throttle - 节流

```javascript
nb.pubfn.throttle(() => {
  // 执行操作
}, 1000)
```

### batchRun - 并发执行

```javascript
const tasks = [
  () => fetch('/api/1'),
  () => fetch('/api/2'),
]
const results = await nb.pubfn.batchRun(tasks, 2)  // 最多同时执行2个
```

---

## ✅ 最佳实践

### 1. 类型判断优先使用 nb.pubfn

```javascript
// ✅ 推荐
if (nb.pubfn.isArray(value)) { }
if (nb.pubfn.isNull(data)) { }

// ❌ 不推荐
if (Array.isArray(value)) { }
if (!data || data === '') { }
```

### 2. 树形数据使用 tree 工具

```javascript
// ✅ 推荐
const tree = nb.pubfn.tree.arrayToTree(list)
const node = nb.pubfn.tree.findInTree(tree, predicate)

// ❌ 不推荐：手写递归
function buildTree(list, parentId = null) { ... }
```

### 3. ID 生成统一使用 uuid

```javascript
// ✅ 推荐
const id = nb.pubfn.uuid()

// ❌ 不推荐
import { v4 as uuidv4 } from 'uuid'
```

---

<div align="center">

[← 返回 API 参考](./README.md)

</div>

