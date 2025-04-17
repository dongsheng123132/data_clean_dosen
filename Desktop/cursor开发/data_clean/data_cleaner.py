import pandas as pd
import numpy as np

def clean_data(file_path):
    """
    数据清洗函数
    功能：
    1. 读取CSV文件
    2. 处理缺失值
    3. 删除重复值
    4. 数据类型转换
    5. 异常值处理
    """
    # 读取数据
    try:
        df = pd.read_csv(file_path)
        print(f"成功读取数据，共 {len(df)} 行")
    except Exception as e:
        print(f"读取数据失败: {e}")
        return None

    # 处理缺失值
    df_cleaned = df.copy()
    df_cleaned = df_cleaned.dropna()  # 删除包含缺失值的行
    print(f"删除缺失值后剩余 {len(df_cleaned)} 行")

    # 删除重复值
    df_cleaned = df_cleaned.drop_duplicates()
    print(f"删除重复值后剩余 {len(df_cleaned)} 行")

    # 数据类型转换
    for col in df_cleaned.columns:
        if df_cleaned[col].dtype == 'object':
            try:
                df_cleaned[col] = pd.to_numeric(df_cleaned[col], errors='coerce')
            except:
                pass

    # 异常值处理（使用IQR方法）
    numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        Q1 = df_cleaned[col].quantile(0.25)
        Q3 = df_cleaned[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df_cleaned[col] = df_cleaned[col].clip(lower_bound, upper_bound)

    return df_cleaned

if __name__ == "__main__":
    # 示例用法
    input_file = "sample_data.csv"
    cleaned_data = clean_data(input_file)
    if cleaned_data is not None:
        cleaned_data.to_csv("cleaned_data.csv", index=False)
        print("数据清洗完成，结果已保存到 cleaned_data.csv") 