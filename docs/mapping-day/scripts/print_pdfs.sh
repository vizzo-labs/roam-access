#!/bin/sh
# Print the flyer, the zone sheets and the whole kit to A4 PDFs with headless Chrome.
#   sh docs/mapping-day/scripts/print_pdfs.sh      (Node 22+ and Google Chrome)
set -e
cd "$(dirname "$0")/.."
D=$(pwd)
node scripts/chrome.mjs pdf "file://$D/flyer.html" pdf/flyer-a4.pdf
node scripts/chrome.mjs pdf "file://$D/zone-sheets.html" pdf/zone-sheets.pdf
node scripts/chrome.mjs pdf "file://$D/kit.html" pdf/kit.pdf
