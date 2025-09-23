-- Sample SQL file with revenue analysis queries

-- Create temporary tables for analysis
CREATE TABLE IF NOT EXISTS quarterly_performance (
    quarter VARCHAR(10),
    total_revenue DECIMAL(15,2),
    total_units INTEGER,
    avg_unit_price DECIMAL(10,2),
    growth_rate DECIMAL(5,2)
);

-- Insert sample quarterly data
INSERT INTO quarterly_performance VALUES
('Q1 2024', 875000.00, 4250, 205.88, 12.5),
('Q4 2023', 778000.00, 3980, 195.48, 8.3),
('Q3 2023', 718000.00, 3750, 191.47, 15.2),
('Q2 2023', 623000.00, 3520, 177.13, 6.8);

-- Revenue analysis by product category
SELECT 
    p.category,
    SUM(s.revenue) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(s.revenue) as avg_transaction_value,
    SUM(s.units_sold) as total_units,
    ROUND(SUM(s.revenue) / SUM(s.units_sold), 2) as avg_unit_price
FROM sales_data s
JOIN products p ON s.product_id = p.id
WHERE s.sale_date >= '2024-01-01'
GROUP BY p.category
ORDER BY total_revenue DESC;

-- Monthly revenue trend analysis
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    SUM(revenue) as monthly_revenue,
    SUM(units_sold) as monthly_units,
    COUNT(DISTINCT customer_id) as unique_customers,
    ROUND(SUM(revenue) / COUNT(DISTINCT customer_id), 2) as revenue_per_customer
FROM sales_data
WHERE sale_date >= '2024-01-01'
GROUP BY DATE_TRUNC('month', sale_date)
ORDER BY month;

-- Customer segment performance
SELECT 
    customer_segment,
    COUNT(*) as transaction_count,
    SUM(revenue) as total_revenue,
    AVG(revenue) as avg_transaction_value,
    SUM(units_sold) as total_units,
    ROUND(SUM(revenue) * 100.0 / SUM(SUM(revenue)) OVER(), 2) as revenue_percentage
FROM sales_data
WHERE sale_date >= '2024-01-01'
GROUP BY customer_segment
ORDER BY total_revenue DESC;

-- Regional performance analysis
SELECT 
    region,
    SUM(revenue) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(revenue) as avg_transaction_value,
    RANK() OVER (ORDER BY SUM(revenue) DESC) as revenue_rank
FROM sales_data
WHERE sale_date >= '2024-01-01'
GROUP BY region
ORDER BY total_revenue DESC;

-- Product performance with growth analysis
WITH monthly_product_sales AS (
    SELECT 
        product_name,
        DATE_TRUNC('month', sale_date) as month,
        SUM(revenue) as monthly_revenue,
        SUM(units_sold) as monthly_units
    FROM sales_data
    WHERE sale_date >= '2024-01-01'
    GROUP BY product_name, DATE_TRUNC('month', sale_date)
),
product_growth AS (
    SELECT 
        product_name,
        month,
        monthly_revenue,
        LAG(monthly_revenue) OVER (PARTITION BY product_name ORDER BY month) as prev_month_revenue,
        ROUND(
            ((monthly_revenue - LAG(monthly_revenue) OVER (PARTITION BY product_name ORDER BY month)) 
            / LAG(monthly_revenue) OVER (PARTITION BY product_name ORDER BY month)) * 100, 2
        ) as growth_rate
    FROM monthly_product_sales
)
SELECT 
    product_name,
    month,
    monthly_revenue,
    prev_month_revenue,
    COALESCE(growth_rate, 0) as growth_rate
FROM product_growth
ORDER BY product_name, month;

-- Top performing products analysis
SELECT 
    product_name,
    SUM(revenue) as total_revenue,
    SUM(units_sold) as total_units,
    COUNT(*) as transaction_count,
    ROUND(AVG(revenue), 2) as avg_transaction_value,
    ROUND(SUM(revenue) / SUM(units_sold), 2) as avg_unit_price,
    DENSE_RANK() OVER (ORDER BY SUM(revenue) DESC) as revenue_rank
FROM sales_data
WHERE sale_date >= '2024-01-01'
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 10;

-- Revenue seasonality analysis
SELECT 
    EXTRACT(MONTH FROM sale_date) as month,
    TO_CHAR(sale_date, 'Month') as month_name,
    SUM(revenue) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(revenue) as avg_transaction_value,
    ROUND(SUM(revenue) * 100.0 / SUM(SUM(revenue)) OVER(), 2) as revenue_percentage
FROM sales_data
WHERE sale_date >= '2024-01-01'
GROUP BY EXTRACT(MONTH FROM sale_date), TO_CHAR(sale_date, 'Month')
ORDER BY month;