# CRUD 系统 Ant Design 官方 API 使用指南

本文档说明如何在 CRUD 系统中使用 Ant Design 官方组件的完整 API。

## 📚 概述

CRUD 系统已全面重构,完全支持 Ant Design 官方组件的所有 API 参数。所有组件都遵循官方文档标准实现。

官方文档: https://ant.design/components/overview-cn/

## 🎯 核心配置方式

### fieldProps - 组件原生属性

通过 `fieldProps` 可以传递所有 Ant Design 官方组件支持的属性:

```javascript
{
  key: 'username',
  title: 'Username',
  type: 'text',
  form: {
    required: true,
    fieldProps: {
      // 所有 Input 组件的官方 API
      prefix: <UserOutlined />,
      suffix: <Tooltip title="用户名提示">icon</Tooltip>,
      showCount: true,
      maxLength: 20,
      size: 'large',
      variant: 'filled',
      addonBefore: 'https://',
      addonAfter: '.com',
      // ... 任何其他 Input 官方属性
    }
  }
}
```

## 📝 组件配置示例

### 1. Input (文本输入框)

**官方文档**: https://ant.design/components/input-cn

```javascript
{
  key: 'email',
  title: 'Email',
  type: 'text',
  form: {
    required: true,
    placeholder: 'Enter your email',
    fieldProps: {
      prefix: <MailOutlined />,
      showCount: true,
      maxLength: 50,
      size: 'large',
      variant: 'outlined', // 'outlined' | 'borderless' | 'filled'
      allowClear: true,
      onPressEnter: () => console.log('pressed enter'),
    }
  }
}
```

### 2. TextArea (多行文本)

**官方文档**: https://ant.design/components/input-cn#inputtextarea

```javascript
{
  key: 'description',
  title: 'Description',
  type: 'textarea',
  form: {
    fieldProps: {
      rows: 4,
      showCount: true,
      maxLength: 500,
      autoSize: { minRows: 3, maxRows: 8 },
      allowClear: true,
    }
  }
}
```

### 3. InputNumber (数字输入)

**官方文档**: https://ant.design/components/input-number-cn

```javascript
{
  key: 'price',
  title: 'Price',
  type: 'number',
  form: {
    fieldProps: {
      min: 0,
      max: 10000,
      step: 0.01,
      precision: 2,
      prefix: '$',
      controls: true,
      keyboard: true,
      stringMode: false, // 高精度小数
      formatter: (value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      parser: (value) => value.replace(/\$\s?|(,*)/g, ''),
    }
  }
}
```

### 4. Select (下拉选择)

**官方文档**: https://ant.design/components/select-cn

```javascript
{
  key: 'category',
  title: 'Category',
  type: 'select',
  options: [
    { label: 'Tech', value: 'tech', disabled: false },
    { label: 'Business', value: 'business' },
    { label: 'Life', value: 'life' },
  ],
  form: {
    fieldProps: {
      mode: 'multiple', // 'multiple' | 'tags'
      showSearch: true,
      filterOption: (input, option) =>
        option.label.toLowerCase().includes(input.toLowerCase()),
      optionFilterProp: 'label',
      maxTagCount: 3,
      loading: false,
      dropdownRender: (menu) => (
        <div>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Button>Add New</Button>
        </div>
      ),
      onSearch: (value) => console.log('search:', value),
    }
  }
}
```

### 5. Radio (单选框)

**官方文档**: https://ant.design/components/radio-cn

```javascript
{
  key: 'gender',
  title: 'Gender',
  type: 'radio',
  options: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ],
  form: {
    fieldProps: {
      optionType: 'button', // 'default' | 'button'
      buttonStyle: 'solid', // 'outline' | 'solid'
      size: 'large',
    }
  }
}
```

### 6. Checkbox (多选框)

**官方文档**: https://ant.design/components/checkbox-cn

```javascript
{
  key: 'interests',
  title: 'Interests',
  type: 'checkbox',
  options: [
    { label: 'Reading', value: 'reading' },
    { label: 'Sports', value: 'sports' },
    { label: 'Music', value: 'music' },
  ],
  form: {
    fieldProps: {
      // Checkbox.Group 的官方 API
    }
  }
}
```

### 7. Switch (开关)

**官方文档**: https://ant.design/components/switch-cn

```javascript
{
  key: 'active',
  title: 'Active Status',
  type: 'switch',
  form: {
    fieldProps: {
      checkedChildren: 'ON',
      unCheckedChildren: 'OFF',
      size: 'default', // 'default' | 'small'
      loading: false,
    }
  }
}
```

### 8. DatePicker (日期选择)

**官方文档**: https://ant.design/components/date-picker-cn

```javascript
{
  key: 'birthday',
  title: 'Birthday',
  type: 'date',
  form: {
    fieldProps: {
      format: 'YYYY-MM-DD',
      picker: 'date', // 'date' | 'week' | 'month' | 'quarter' | 'year'
      showTime: false,
      disabledDate: (current) => current && current > dayjs().endOf('day'),
      presets: [
        { label: 'Yesterday', value: dayjs().add(-1, 'd') },
        { label: 'Last Week', value: dayjs().add(-7, 'd') },
      ],
    }
  }
}
```

### 9. DatePicker with Time (日期时间)

```javascript
{
  key: 'publishAt',
  title: 'Publish Time',
  type: 'datetime',
  form: {
    fieldProps: {
      format: 'YYYY-MM-DD HH:mm:ss',
      showTime: {
        defaultValue: dayjs('00:00:00', 'HH:mm:ss'),
        format: 'HH:mm:ss',
      },
    }
  }
}
```

### 10. RangePicker (日期范围)

```javascript
{
  key: 'dateRange',
  title: 'Date Range',
  type: 'daterange',
  search: {
    fieldProps: {
      format: 'YYYY-MM-DD',
      separator: '~',
      presets: [
        { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
        { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
      ],
    }
  }
}
```

### 11. TimePicker (时间选择)

**官方文档**: https://ant.design/components/time-picker-cn

```javascript
{
  key: 'workTime',
  title: 'Work Time',
  type: 'time',
  form: {
    fieldProps: {
      format: 'HH:mm:ss',
      hourStep: 1,
      minuteStep: 15,
      secondStep: 10,
      use12Hours: false,
      showNow: true,
      hideDisabledOptions: true,
      disabledTime: () => ({
        disabledHours: () => [0, 1, 2, 3, 4, 5],
      }),
    }
  }
}
```

### 12. Upload (文件上传)

**官方文档**: https://ant.design/components/upload-cn

```javascript
{
  key: 'avatar',
  title: 'Avatar',
  type: 'image',
  form: {
    max: 1,
    fieldProps: {
      listType: 'picture-card', // 'text' | 'picture' | 'picture-card' | 'picture-circle'
      accept: 'image/*',
      action: '/api/upload',
      method: 'POST',
      headers: {
        authorization: 'Bearer xxx',
      },
      data: { folder: 'avatars' },
      multiple: false,
      maxCount: 1,
      beforeUpload: (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
          message.error('You can only upload JPG/PNG file!');
        }
        return isJpgOrPng;
      },
      onChange: (info) => {
        if (info.file.status === 'done') {
          message.success(`${info.file.name} uploaded successfully`);
        }
      },
      onPreview: async (file) => {
        window.open(file.url);
      },
      onRemove: (file) => {
        console.log('removed', file);
      },
      customRequest: async ({ file, onSuccess, onError }) => {
        // 自定义上传实现
      },
      showUploadList: {
        showPreviewIcon: true,
        showRemoveIcon: true,
        showDownloadIcon: true,
      },
    }
  }
}
```

### 13. Rate (评分)

**官方文档**: https://ant.design/components/rate-cn

```javascript
{
  key: 'rating',
  title: 'Rating',
  type: 'rate',
  form: {
    fieldProps: {
      count: 5,
      allowHalf: true,
      allowClear: true,
      character: <StarFilled />,
      tooltips: ['terrible', 'bad', 'normal', 'good', 'wonderful'],
    }
  }
}
```

### 14. Slider (滑动输入条)

**官方文档**: https://ant.design/components/slider-cn

```javascript
{
  key: 'volume',
  title: 'Volume',
  type: 'slider',
  form: {
    fieldProps: {
      min: 0,
      max: 100,
      step: 1,
      marks: {
        0: '0°C',
        26: '26°C',
        37: '37°C',
        100: {
          style: { color: '#f50' },
          label: <strong>100°C</strong>,
        },
      },
      dots: false,
      range: false,
      vertical: false,
      reverse: false,
      tooltip: {
        open: true,
        placement: 'top',
      },
    }
  }
}
```

### 15. ColorPicker (颜色选择器)

**官方文档**: https://ant.design/components/color-picker-cn

```javascript
{
  key: 'themeColor',
  title: 'Theme Color',
  type: 'color',
  form: {
    fieldProps: {
      format: 'hex', // 'rgb' | 'hex' | 'hsb'
      showText: true,
      size: 'default',
      presets: [
        {
          label: 'Recommended',
          colors: [
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#f5222d',
          ],
        },
      ],
      panelRender: (panel) => (
        <div>
          {panel}
          <Divider />
          <div>Custom Footer</div>
        </div>
      ),
    }
  }
}
```

### 16. Cascader (级联选择)

**官方文档**: https://ant.design/components/cascader-cn

```javascript
{
  key: 'location',
  title: 'Location',
  type: 'cascader',
  data: [
    {
      value: 'china',
      label: 'China',
      children: [
        {
          value: 'beijing',
          label: 'Beijing',
          children: [
            { value: 'chaoyang', label: 'Chaoyang' },
            { value: 'haidian', label: 'Haidian' },
          ],
        },
      ],
    },
  ],
  form: {
    fieldProps: {
      changeOnSelect: true,
      showSearch: true,
      expandTrigger: 'hover', // 'click' | 'hover'
      multiple: false,
      fieldNames: { label: 'label', value: 'value', children: 'children' },
      displayRender: (labels) => labels.join(' / '),
      loadData: async (selectedOptions) => {
        // 动态加载数据
      },
    }
  }
}
```

### 17. TreeSelect (树形选择)

**官方文档**: https://ant.design/components/tree-select-cn

```javascript
{
  key: 'department',
  title: 'Department',
  type: 'tree-select',
  data: [
    {
      title: 'Engineering',
      value: 'engineering',
      children: [
        { title: 'Frontend', value: 'frontend' },
        { title: 'Backend', value: 'backend' },
      ],
    },
  ],
  form: {
    fieldProps: {
      multiple: false,
      treeCheckable: false,
      showSearch: true,
      treeDefaultExpandAll: true,
      treeNodeFilterProp: 'title',
      fieldNames: { label: 'title', value: 'value', children: 'children' },
      treeData: [], // 可以通过 fieldProps 覆盖 data
      loadData: async (node) => {
        // 动态加载子节点
      },
    }
  }
}
```

## 🔧 高级用法

### 1. 表单项联动

```javascript
{
  key: 'country',
  title: 'Country',
  type: 'select',
  options: countries,
  form: {
    fieldProps: {
      onChange: (value, option) => {
        // 触发其他字段更新
        form.setFieldsValue({ city: undefined });
        // 加载城市数据
        loadCities(value);
      },
    }
  }
}
```

### 2. 自定义渲染

```javascript
{
  key: 'customField',
  title: 'Custom Field',
  type: 'text',
  table: {
    render: (value, record) => {
      // 自定义表格渲染
      return <Tag color="blue">{value}</Tag>;
    }
  },
  form: {
    render: (config) => {
      // 完全自定义表单组件
      return <MyCustomComponent />;
    }
  }
}
```

### 3. 条件显示/禁用

```javascript
{
  key: 'email',
  title: 'Email',
  type: 'text',
  form: {
    // 根据其他字段值动态设置
    dependencies: ['userType'],
    shouldUpdate: (prevValues, curValues) => 
      prevValues.userType !== curValues.userType,
    fieldProps: ({ getFieldValue }) => ({
      disabled: getFieldValue('userType') === 'guest',
    }),
  }
}
```

### 4. 异步数据加载

```javascript
{
  key: 'category',
  title: 'Category',
  type: 'select',
  form: {
    fieldProps: {
      loading: true, // 初始加载状态
      showSearch: true,
      onSearch: debounce(async (value) => {
        // 搜索远程数据
        const results = await searchCategories(value);
        // 更新 options
      }, 300),
    }
  }
}
```

## 📖 配置层级说明

```javascript
{
  key: 'fieldName',
  title: 'Field Title',
  type: 'text',
  
  // 表格配置
  table: {
    width: 200,
    ellipsis: true,
    render: (value) => value, // 自定义渲染
    // ... 其他 ProTable column 配置
  },
  
  // 表单配置
  form: {
    required: true,
    placeholder: 'Enter value',
    
    // Ant Design 组件原生属性
    fieldProps: {
      // 所有组件官方 API 都在这里配置
      size: 'large',
      disabled: false,
      // ... 更多原生属性
    },
    
    // Pro Components 特有属性
    props: {
      // ProForm 组件的额外属性
    }
  },
  
  // 搜索配置
  search: {
    fieldProps: {
      // 搜索时的组件配置
    }
  },
  
  // 详情配置
  detail: {
    render: (value) => value, // 自定义详情渲染
  }
}
```

## ✅ 最佳实践

### 1. 使用标准的 fieldProps

```javascript
// ✅ 推荐 - 使用 fieldProps
form: {
  fieldProps: {
    maxLength: 100,
    showCount: true,
  }
}

// ❌ 避免 - 直接在 form 下配置
form: {
  maxLength: 100, // 这不是标准方式
}
```

### 2. 参考官方文档

每个组件的注释都包含官方文档链接,使用前请查阅官方文档了解所有可用属性:

```javascript
/**
 * 文本输入框 (Input)
 * Ant Design 官方文档: https://ant.design/components/input-cn
 */
```

### 3. 类型安全

如果使用 TypeScript,可以导入 Ant Design 的类型定义:

```typescript
import type { InputProps, SelectProps } from 'antd';

const fieldConfig = {
  key: 'email',
  type: 'text',
  form: {
    fieldProps: {
      // TypeScript 会提示所有 InputProps
    } as InputProps
  }
}
```

## 🎨 完整示例

```javascript
export const productFieldsConfig = [
  {
    key: 'name',
    title: 'Product Name',
    type: 'text',
    table: {
      width: 200,
      ellipsis: true,
      fixed: 'left',
    },
    form: {
      required: true,
      fieldProps: {
        prefix: <TagOutlined />,
        showCount: true,
        maxLength: 100,
        placeholder: 'Enter product name',
      }
    },
    search: {
      fieldProps: {
        placeholder: 'Search products...',
      }
    }
  },
  {
    key: 'price',
    title: 'Price',
    type: 'number',
    form: {
      required: true,
      fieldProps: {
        min: 0,
        max: 999999,
        precision: 2,
        prefix: '$',
        formatter: (value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        parser: (value) => value.replace(/\$\s?|(,*)/g, ''),
      }
    }
  },
  {
    key: 'category',
    title: 'Category',
    type: 'select',
    options: [
      { label: 'Electronics', value: 'electronics' },
      { label: 'Clothing', value: 'clothing' },
      { label: 'Books', value: 'books' },
    ],
    form: {
      required: true,
      fieldProps: {
        showSearch: true,
        filterOption: true,
      }
    }
  },
  {
    key: 'images',
    title: 'Product Images',
    type: 'image',
    form: {
      max: 5,
      fieldProps: {
        listType: 'picture-card',
        accept: 'image/*',
        action: '/api/upload',
        beforeUpload: (file) => {
          const isLt2M = file.size / 1024 / 1024 < 2;
          if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
          }
          return isLt2M;
        },
      }
    }
  },
];
```

## 🔗 相关文档

- [Ant Design 官方文档](https://ant.design/components/overview-cn/)
- [Pro Components 文档](https://procomponents.ant.design/)
- [CRUD 系统概述](./crud-system-overview.md)

## 📞 支持

如有问题,请查阅 Ant Design 官方文档或提交 Issue。

