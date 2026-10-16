KineticSlotNet interactive presentation

The presentation includes local event data, Three.js visualization code,
the event-stream explorer, and the prediction-analysis page.

Linux:
  1. Open a terminal in this folder.
  2. Run: ./start_presentation.sh
  3. Open: http://127.0.0.1:8766/index.html

If port 8766 is busy, run:
  ./start_presentation.sh 8767

Windows:
  1. Double-click start_presentation_windows.bat.
  2. The browser opens automatically at http://127.0.0.1:8766/index.html.
  3. Keep the black command window open while presenting.

Windows requires Python 3. If Python is installed through the Microsoft
Store or python.org, the launcher `py` is usually available.

Do not open index.html directly with file:// because browsers may block
local module and JSON requests used by the interactive visualizations.
