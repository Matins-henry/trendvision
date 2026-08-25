#!/bin/bash
# Append part2 to main design doc
tail -n +2 design-part2.md >> design.md
# Remove temp file
rm design-part2.md
