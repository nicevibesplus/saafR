-- Verify all edges have source/target
SELECT COUNT(*) FROM ways WHERE source IS NULL OR target IS NULL;
SELECT MIN(cost), MAX(cost), AVG(cost) FROM ways;
SELECT MIN(reverse_cost), MAX(reverse_cost), AVG(reverse_cost) FROM ways;
