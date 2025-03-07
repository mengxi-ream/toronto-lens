import pandas as pd
import re
import os

crime_df = pd.read_csv('/Users/millyphilly/Desktop/CPSC304 project/g15/static/data/processed/neighbourhood-crime-rates.csv')

# Replace 'Break and Enter' with 'Burglary'
crime_df['crime_type'] = crime_df['crime_type'].replace('Break and Enter', 'Burglary')

# Remove the "neighbourhood" column
crime_df.drop(columns=['neighbourhood'], inplace=True)

# Aggregate the data to get total population and total crime count for each crime type and year
aggregated_df = crime_df.groupby(['crime_type', 'year']).agg({
    'population': 'sum',
    'crime_count': 'sum'
}).reset_index()

# Calculate the crime rate for each crime type and year
aggregated_df['crime_rate'] = (aggregated_df['crime_count'] / aggregated_df['population']) * 100000

# Save the modified DataFrame to a new CSV file
new_csv_file_path = '/Users/millyphilly/Desktop/CPSC304 project/g15/static/data/processed/toronto-crime-rate.csv'
aggregated_df.to_csv(new_csv_file_path, index=False)

# print(f"Modified data saved to {new_csv_file_path}")

# print("Current working directory:", os.getcwd())

def calculate_overall_crime_rate(df, crime_type, year):
    # Filter the DataFrame for the specific crime type and year
    filtered_df = df[(df['crime_type'] == crime_type) & (df['year'] == year)]
    
    # Calculate the weighted sum of crime rates
    weighted_sum = (filtered_df['population'] * filtered_df['crime_rate']).sum()
    
    # Calculate the total population
    total_population = filtered_df['population'].sum()
    
    # Calculate the overall crime rate
    overall_crime_rate = weighted_sum / total_population if total_population > 0 else 0
    
    return overall_crime_rate

