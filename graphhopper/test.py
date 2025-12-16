import osmium
import pandas as pd
import sys

# --- 1. CONFIGURATION ---
INPUT_PBF = "./data/muenster-regbez-251103.osm.pbf"
OUTPUT_PBF = "./data/muenster-crashes.osm.pbf"
CSV_FILE = "./data/data-crashes.csv"

# --- 2. PREPARATION ---
print(f"Loading crash data from {CSV_FILE}...")
try:
    df = pd.read_csv(CSV_FILE, names=["osm_id", "count"], dtype=str)
    df.osm_id = pd.to_numeric(df.osm_id, errors="coerce")
    df = df.dropna(subset=["osm_id"])
    
    crash_lookup = dict(zip(df.osm_id.astype(int), df["count"]))
    
    print(f"Loaded {len(crash_lookup)} valid way records to keep.")

except Exception as e:
    print(f"Error loading CSV: {e}")
    sys.exit(1)


# --- 3. THE INJECTOR CLASS ---
class CrashWhitelist(osmium.SimpleHandler):
    def __init__(self, writer):
        super(CrashWhitelist, self).__init__()
        self.writer = writer
        self.kept_count = 0
        self.dropped_count = 0

    def node(self, n):
        # We must keep ALL nodes because we don't know yet which ones 
        # are used by the ways we will keep (PBF is ordered Nodes -> Ways).
        # This makes the file larger than necessary, but ensures validity.
        self.writer.add_node(n)

    def relation(self, r):
        # We generally keep relations or the file structure might break,
        # though empty relations are harmless.
        self.writer.add_relation(r)

    def way(self, w):
        # LOGIC: Only write the way if it is in our whitelist
        if w.id in crash_lookup:
            try:
                # Copy and update tags
                current_tags = dict(w.tags)
                current_tags["crash_count"] = crash_lookup[w.id]
                
                # Write the way
                self.writer.add_way(w.replace(tags=current_tags))
                self.kept_count += 1
            except Exception as e:
                print(f"Error processing way {w.id}: {e}")
        else:
            # DROP IT (Do nothing)
            self.dropped_count += 1

# --- 4. EXECUTION ---
print(f"--- Filtering {INPUT_PBF} ---")
print("Only ways found in the CSV will be preserved. All others are deleted.")

writer = osmium.SimpleWriter(OUTPUT_PBF)
injector = CrashWhitelist(writer)
injector.apply_file(INPUT_PBF)
writer.close()

print("\nProcessing Complete.")
print(f"Ways Kept:    {injector.kept_count}")
print(f"Ways Dropped: {injector.dropped_count}")
print(f"Created:      {OUTPUT_PBF}")