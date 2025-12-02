# NB 公共函数库 (nb.pubfn)

参考 [vk-unicloud 的 pubfn API](https://vkdoc.fsq.pub/client/jsapi.html#common) 设计，提供统一的工具函数库。

## 使用方式

```javascript
import nb from '@/lib/function';

// 使用示例
nb.pubfn.isNull(value);
nb.pubfn.timeFormat(new Date());
nb.pubfn.tree.arrayToTree(list);
```

---

## API 目录

- [时间处理](#时间处理)
- [数据校验](#数据校验)
- [对象操作](#对象操作)
- [数组操作](#数组操作)
- [树形结构](#树形结构)
- [字符串处理](#字符串处理)
- [函数工具](#函数工具)

---

## 时间处理

### timeFormat - 日期格式化

```javascript
nb.pubfn.timeFormat(date, format, targetTimezone);
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | Date/Number/String | 是 | 日期对象、时间戳或日期字符串 |
| format | String | 否 | 格式化模板，默认 `yyyy-MM-dd hh:mm:ss` |
| targetTimezone | Number | 否 | 目标时区，默认 8（东八区） |

**格式化占位符：**
- `yyyy` - 年份
- `MM` - 月份
- `dd` - 日期
- `hh` - 小时
- `mm` - 分钟
- `ss` - 秒
- `q` - 季度
- `S` - 毫秒

```javascript
nb.pubfn.timeFormat(new Date(), 'yyyy-MM-dd');
// 输出: "2025-12-02"

nb.pubfn.timeFormat(1733136000000, 'yyyy年MM月dd日 hh:mm');
// 输出: "2025年12月02日 18:00"
```

### getDateInfo - 解析日期对象

```javascript
nb.pubfn.getDateInfo(date);
```

返回日期的各个属性：

```javascript
const info = nb.pubfn.getDateInfo(new Date());
// {
//   year: 2025,
//   month: 12,
//   day: 2,
//   hour: 18,
//   minute: 30,
//   second: 0,
//   millisecond: 0,
//   week: 1,      // 0=周日, 1=周一, ...
//   quarter: 4    // 季度
// }
```

### getCommonTime - 获取时间范围

```javascript
nb.pubfn.getCommonTime(date);
```

返回常用时间范围（时间戳）：

```javascript
const time = nb.pubfn.getCommonTime();
// {
//   todayStart: 1733068800000,   // 今日开始
//   todayEnd: 1733155199999,     // 今日结束
//   monthStart: 1730390400000,   // 本月开始
//   monthEnd: 1733068799999,     // 本月结束
//   yearStart: 1704038400000,    // 本年开始
//   yearEnd: 1735689599999,      // 本年结束
//   weekStart: 1732982400000,    // 本周开始
//   weekEnd: 1733587199999,      // 本周结束
//   now: 1733136000000           // 当前时间
// }
```

### getDayOffsetStartAndEnd - 获取 N 天前/后的起止时间

```javascript
nb.pubfn.getDayOffsetStartAndEnd(count, date);
```

| 参数 | 类型 | 说明 |
|------|------|------|
| count | Number | 0=今天, -1=昨天, 1=明天 |
| date | Date | 可选，指定基准日期 |

```javascript
// 昨天的起止时间
const yesterday = nb.pubfn.getDayOffsetStartAndEnd(-1);
// { startTime: 1732982400000, endTime: 1733068799999 }
```

### getMonthOffsetStartAndEnd - 获取 N 月前/后的起止时间

```javascript
// 上个月
nb.pubfn.getMonthOffsetStartAndEnd(-1);

// 下个月
nb.pubfn.getMonthOffsetStartAndEnd(1);
```

### getYearOffsetStartAndEnd - 获取 N 年前/后的起止时间

```javascript
// 去年
nb.pubfn.getYearOffsetStartAndEnd(-1);
```

### sleep - 休眠等待

```javascript
await nb.pubfn.sleep(1000); // 等待 1 秒
```

---

## 数据校验

### isNull / isNotNull - 空值判断

```javascript
nb.pubfn.isNull(value);    // 是否为空
nb.pubfn.isNotNull(value); // 是否不为空
```

**以下值被视为空：**
- `undefined`
- `null`
- `""`（空字符串）
- `{}`（空对象）
- `[]`（空数组）

```javascript
nb.pubfn.isNull(null);      // true
nb.pubfn.isNull('');        // true
nb.pubfn.isNull({});        // true
nb.pubfn.isNull([]);        // true
nb.pubfn.isNull(0);         // false
nb.pubfn.isNull('hello');   // false
```

### isNullOne / isNullAll / isNotNullAll - 批量空值判断

```javascript
// 是否至少有一个为空
nb.pubfn.isNullOne(value1, value2, value3);

// 是否全部为空
nb.pubfn.isNullAll(value1, value2, value3);

// 是否全部不为空
nb.pubfn.isNotNullAll(value1, value2, value3);
```

### test - 格式校验

```javascript
nb.pubfn.test(str, type, allowEmpty);
```

| type | 说明 |
|------|------|
| `mobile` | 手机号码 |
| `tel` | 座机 |
| `email` | 邮箱 |
| `card` | 身份证 |
| `url` | 网址 |
| `ip` | IP 地址 |
| `number` | 纯数字 |
| `english` | 纯英文 |
| `chinese` | 纯中文 |
| `date` | 日期 (2020-08-03) |
| `time` | 时间 (12:00:00) |
| `datetime` | 日期时间 |
| `money` | 金额（小数点2位） |
| `username` | 账号（字母开头，3-32位） |
| `password` | 密码（6-18位） |
| `image` | 图片格式 |
| `video` | 视频格式 |

```javascript
nb.pubfn.test('13800138000', 'mobile');  // true
nb.pubfn.test('test@example.com', 'email');  // true
nb.pubfn.test('192.168.1.1', 'ip');  // true
```

### validator - Vue 表单验证器

```javascript
// 用于 Form rules
const rules = {
  mobile: [
    { validator: nb.pubfn.validator('mobile'), message: '手机号格式错误' }
  ],
  email: [
    { validator: nb.pubfn.validator('email'), message: '邮箱格式错误' }
  ]
};
```

### isArray / isObject - 类型判断

```javascript
nb.pubfn.isArray([1, 2, 3]);  // true
nb.pubfn.isObject({ a: 1 });  // true
```

---

## 对象操作

### deepClone - 深度克隆

```javascript
const newObj = nb.pubfn.deepClone(obj);
```

支持克隆函数，解除原对象的映射关系。

### copyObject - 复制对象（JSON 方式）

```javascript
const newObj = nb.pubfn.copyObject(obj);
```

不支持克隆函数，但性能更好。

### getData / setData - 路径取值/设值

```javascript
const obj = { a: { b: { c: 1 } } };

// 取值
nb.pubfn.getData(obj, 'a.b.c');  // 1
nb.pubfn.getData(obj, 'a.b.d', 'default');  // 'default'

// 设值
nb.pubfn.setData(obj, 'a.b.c', 2);
nb.pubfn.setData(obj, 'x.y.z', 3);  // 自动创建路径
```

### objectAssign - 对象属性拷贝

```javascript
nb.pubfn.objectAssign(obj1, obj2, deleteInvalid);
```

将 obj2 的属性赋值给 obj1，可选删除无效值。

### formAssign - 表单数据填充

```javascript
const defaultData = { name: '', age: 0, enable: true };
const itemData = { name: '张三', age: 25 };

const formData = nb.pubfn.formAssign(defaultData, itemData);
// { name: '张三', age: 25, enable: true }
```

### getNewObject - 从对象中取多个属性

```javascript
const obj = { id: 1, name: '张三', age: 25, email: 'test@test.com' };
const newObj = nb.pubfn.getNewObject(obj, ['id', 'name']);
// { id: 1, name: '张三' }
```

### deleteObjectKeys - 删除对象指定字段

```javascript
const obj = { id: 1, name: '张三', password: '123456' };
const newObj = nb.pubfn.deleteObjectKeys(obj, ['password']);
// { id: 1, name: '张三' }
```

---

## 数组操作

### getListItem - 获取数组中某个对象

```javascript
const list = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
];

nb.pubfn.getListItem(list, 'id', 2);
// { id: 2, name: '李四' }
```

### getListIndex - 获取数组中某个对象的索引

```javascript
nb.pubfn.getListIndex(list, 'id', 2);  // 1
```

### arrayToJson - 数组转对象

```javascript
const list = [
  { id: 'a', name: '张三' },
  { id: 'b', name: '李四' }
];

nb.pubfn.arrayToJson(list, 'id');
// { a: { id: 'a', name: '张三' }, b: { id: 'b', name: '李四' } }
```

### arrayObjectGetArray - 从数组中提取某字段

```javascript
const list = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
];

nb.pubfn.arrayObjectGetArray(list, 'id');
// [1, 2]
```

### arr_concat - 数组合并去重

```javascript
const arr1 = [{ id: 1, name: '张三' }];
const arr2 = [{ id: 1, name: '张三' }, { id: 2, name: '李四' }];

nb.pubfn.arr_concat(arr1, arr2, 'id');
// [{ id: 1, name: '张三' }, { id: 2, name: '李四' }]
```

### checkArrayIntersection - 两数组是否有交集

```javascript
nb.pubfn.checkArrayIntersection([1, 2, 3], [3, 4, 5]);  // true
nb.pubfn.checkArrayIntersection([1, 2], [3, 4]);  // false
```

---

## 树形结构

所有树形结构工具都在 `nb.pubfn.tree` 下。

### arrayToTree - 数组转树

```javascript
nb.pubfn.tree.arrayToTree(arr, options);
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | String | 'id' | 主键字段名 |
| parentId | String | 'parentId' | 父级字段名 |
| children | String | 'children' | 子节点字段名 |
| rootParentId | any | null | 根节点的 parentId 值 |
| deleteParentId | Boolean | false | 是否删除 parentId 字段 |
| filter | Function | null | 过滤函数 |
| transform | Function | null | 转换函数 |
| sortBy | Array | null | 排序字段 |

```javascript
const list = [
  { id: 1, parentId: null, name: '系统管理' },
  { id: 2, parentId: 1, name: '用户管理' },
  { id: 3, parentId: 1, name: '角色管理' },
  { id: 4, parentId: null, name: '内容管理' },
];

// 基础用法
const tree = nb.pubfn.tree.arrayToTree(list);

// 带过滤和排序
const tree = nb.pubfn.tree.arrayToTree(list, {
  filter: (item) => item.enable !== false,
  sortBy: [{ field: 'sort', order: 'asc' }]
});

// 自定义字段名
const tree = nb.pubfn.tree.arrayToTree(list, {
  id: '_id',
  parentId: 'pid',
  children: 'items'
});
```

### treeToArray - 树转数组

```javascript
nb.pubfn.tree.treeToArray(tree, options);
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| children | String | 'children' | 子节点字段名 |
| deleteChildren | Boolean | true | 是否删除 children 字段 |
| addLevel | Boolean | false | 是否添加层级字段 |
| levelField | String | 'level' | 层级字段名 |
| addPath | Boolean | false | 是否添加路径字段 |
| pathField | String | 'path' | 路径字段名 |

```javascript
// 基础用法
const list = nb.pubfn.tree.treeToArray(tree);

// 添加层级信息
const list = nb.pubfn.tree.treeToArray(tree, { addLevel: true });
// [{ id: 1, name: 'A', level: 0 }, { id: 2, name: 'B', level: 1 }, ...]
```

### mapTree - 映射树

```javascript
nb.pubfn.tree.mapTree(tree, mapper, options);
```

类似 `Array.map`，对树的每个节点进行转换。

```javascript
// 转换为 TreeSelect 格式
const selectTree = nb.pubfn.tree.mapTree(menuTree, (node) => ({
  title: node.name,
  value: node.id,
  key: node.id,
}));
```

### findInTree - 在树中查找节点

```javascript
nb.pubfn.tree.findInTree(tree, predicate, options);
```

返回第一个匹配的节点，未找到返回 `null`。

```javascript
const node = nb.pubfn.tree.findInTree(menuTree, (item) => item.id === 'menu-1');
```

### findAllInTree - 查找所有匹配节点

```javascript
const nodes = nb.pubfn.tree.findAllInTree(menuTree, (item) => item.type === 'menu');
```

### filterTree - 过滤树

```javascript
nb.pubfn.tree.filterTree(tree, predicate, options);
```

保留匹配节点及其父级。

```javascript
// 搜索过滤
const filtered = nb.pubfn.tree.filterTree(menuTree, (item) => 
  item.name.includes('用户')
);
```

### traverseTree - 遍历树

```javascript
nb.pubfn.tree.traverseTree(tree, callback, options);
```

深度优先遍历。

```javascript
nb.pubfn.tree.traverseTree(menuTree, (node, level, parent) => {
  console.log('  '.repeat(level) + node.name);
});
```

### getLeaves - 获取所有叶子节点

```javascript
const leaves = nb.pubfn.tree.getLeaves(menuTree);
```

### getParentsInTree - 获取父级链

```javascript
const parents = nb.pubfn.tree.getParentsInTree(menuTree, (item) => item.id === 'sub-menu-1');
// 返回从根到直接父级的数组
```

### fillMissingParents - 补全缺失的父节点

```javascript
nb.pubfn.tree.fillMissingParents(nodes, allNodes, options);
```

当选中子节点但父节点不在列表中时，自动补全父节点。

```javascript
const complete = nb.pubfn.tree.fillMissingParents(selectedMenus, allMenus);
```

---

## 字符串处理

### hidden - 隐藏中间字符

```javascript
nb.pubfn.hidden(str, first, last);
```

```javascript
nb.pubfn.hidden('13800138000', 3, 4);  // '138****8000'
nb.pubfn.hidden('test@example.com', 2, 4);  // 'te*********m'
```

### random - 生成随机字符串

```javascript
nb.pubfn.random(length, range);
```

```javascript
nb.pubfn.random(6);  // '123456'（纯数字）
nb.pubfn.random(8, 'a-z,0-9');  // 'a1b2c3d4'
nb.pubfn.random(8, 'A-Z,0-9');  // 'A1B2C3D4'
nb.pubfn.random(10, 'a-z,A-Z,0-9');  // 'aB1cD2eF3g'
```

### queryParams - 对象转 URL 参数

```javascript
nb.pubfn.queryParams(data, isPrefix, arrayFormat);
```

```javascript
nb.pubfn.queryParams({ name: '张三', age: 25 });
// '?name=张三&age=25'

nb.pubfn.queryParams({ name: '张三' }, false);
// 'name=张三'

nb.pubfn.queryParams({ ids: [1, 2, 3] }, true, 'brackets');
// '?ids[]=1&ids[]=2&ids[]=3'
```

---

## 函数工具

### debounce - 防抖函数

```javascript
nb.pubfn.debounce(fn, time, isImmediate, timeoutName);
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fn | Function | - | 要执行的函数 |
| time | Number | 500 | 延时时间（毫秒） |
| isImmediate | Boolean | true | 是否立即执行 |
| timeoutName | String | 'default' | 定时器 ID |

```javascript
// 搜索输入防抖
const handleSearch = () => {
  nb.pubfn.debounce(() => {
    // 执行搜索
  }, 300);
};
```

### throttle - 节流函数

```javascript
nb.pubfn.throttle(fn, time, isImmediate, timeoutName);
```

```javascript
// 按钮点击节流
const handleClick = () => {
  nb.pubfn.throttle(() => {
    // 执行操作
  }, 1000);
};
```

---

## 完整示例

```javascript
import nb from '@/lib/function';

// 1. 格式化时间
const dateStr = nb.pubfn.timeFormat(new Date(), 'yyyy-MM-dd hh:mm:ss');

// 2. 验证手机号
if (!nb.pubfn.test(phone, 'mobile')) {
  throw new Error('手机号格式错误');
}

// 3. 空值检查
if (nb.pubfn.isNullOne(name, email, phone)) {
  throw new Error('请填写完整信息');
}

// 4. 深拷贝对象
const newData = nb.pubfn.deepClone(formData);

// 5. 构建菜单树
const menuTree = nb.pubfn.tree.arrayToTree(menuList, {
  filter: (item) => item.enable,
  sortBy: [{ field: 'sort', order: 'asc' }]
});

// 6. 转换为 TreeSelect 格式
const selectTree = nb.pubfn.tree.mapTree(menuTree, (node) => ({
  title: node.name,
  value: node.id,
  key: node.id,
}));

// 7. 查找节点
const currentMenu = nb.pubfn.tree.findInTree(menuTree, (item) => item.url === currentPath);

// 8. 防抖搜索
const handleSearch = (keyword) => {
  nb.pubfn.debounce(() => {
    fetchData({ keyword });
  }, 300);
};
```

