#!/bin/bash
set -e
cd /home/murnanedaniel/Research/conferences/faculty_retreat/stage/scripts/phase_a
PHASE_A=/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/phase_a

echo "=== $(date '+%F %T') 01_fetch_and_extract.py starting ===" | tee -a "$PHASE_A/run_all.log"
python3 01_fetch_and_extract.py 2>&1 | tee -a "$PHASE_A/logs/01_fetch.log" | grep -E "^(===|  |Done|WARN|ERROR)" | tail -200 >> "$PHASE_A/run_all.log" || true

echo "=== $(date '+%F %T') 01b_pure_fallback.py starting ===" | tee -a "$PHASE_A/run_all.log"
python3 01b_pure_fallback.py 2>&1 | tee -a "$PHASE_A/logs/01b_pure.log" | grep -E "^(===|  |Done|WARN|ERROR)" | tail -200 >> "$PHASE_A/run_all.log" || true

echo "=== $(date '+%F %T') 01c_patch8_abstract_chain.py starting ===" | tee -a "$PHASE_A/run_all.log"
python3 01c_patch8_abstract_chain.py 2>&1 | tee -a "$PHASE_A/logs/01c_patch8.log" >> "$PHASE_A/run_all.log" || true

echo "=== $(date '+%F %T') 01d_patch9_collaboration_filter.py starting ===" | tee -a "$PHASE_A/run_all.log"
python3 01d_patch9_collaboration_filter.py 2>&1 | tee -a "$PHASE_A/logs/01d_patch9.log" >> "$PHASE_A/run_all.log" || true

echo "=== $(date '+%F %T') All stages done ===" | tee -a "$PHASE_A/run_all.log"
