# 数据清洗工具 (Data Cleaning Tool)

这是一个简单的数据清洗Python脚本，用于处理CSV格式的数据文件。该工具提供了基本的数据清洗功能，包括缺失值处理、重复值删除、数据类型转换和异常值处理。

## 功能特点

- 自动读取CSV文件
- 处理缺失值（删除包含缺失值的行）
- 删除重复值
- 自动数据类型转换
- 异常值处理（使用IQR方法）

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

1. 准备数据文件（CSV格式）
2. 运行脚本：
```bash
python data_cleaner.py
```

## 示例数据

项目包含一个示例数据文件 `sample_data.csv`，您可以使用它来测试脚本的功能。

## 输出

脚本会生成一个名为 `cleaned_data.csv` 的清洗后的数据文件。

## 注意事项

- 确保输入文件是CSV格式
- 建议在处理重要数据前先备份原始数据
- 脚本会自动处理数值型数据的异常值，使用IQR方法

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License 