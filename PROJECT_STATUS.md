# VastuVision - Project Status

## 1. Completed Features

*   **User Authentication Flow:** Fully functional JWT-based registration and login system with encrypted passwords using `bcryptjs`.
*   **Project Management (CRUD):** Real MongoDB integration. Users can view, create, and delete projects in 'My Library'. The Dashboard displays real-time statistics.
*   **Blueprint Analysis Pipeline:**
    *   Image upload via the main frontend.
    *   Node.js proxy forwarding the image to the Python FastAPI server.
    *   Python UNet model successfully predicting wall coordinates.
    *   Cross-origin coordinate transfer via URL parameters and `postMessage` to the 3D Workspace.
*   **3D Rendering:** The ArchVision 3D workspace parses wall coordinates and renders them accurately.
*   **Vastu Rule Engine:** A mathematical rule-based engine (`vastuEngine.js`) built into the backend, calculating Vastu compliance using the Ashtadisha (8-zone) system without needing ML.
*   **Vastu Audit Interface:** UI for requesting Vastu analysis, displaying conflict warnings, providing AI recommendations, and generating downloadable PDF reports using `jsPDF`.

## 2. Pending Features

*   **Interactive Room Labeling (BlueprintAnalysis.jsx):** UI to manually label the detected zones (e.g., "Kitchen", "Master Bedroom") before running the Vastu Audit.
*   **3D Vastu Zone Overlays:** Adding visual colored representations of N/S/E/W zones into the Three.js 3D space.
*   **Full Workspace State Persistence:** Ensuring furniture placements and wall edits from the 3D workspace are saved back to the `Project` MongoDB document and reloaded on next visit.
*   **Automated Room Segmentation (ML Phase 2):** Training a new UNet model on the CubiCasa5K dataset to replace manual room labeling with AI-based room segmentation.

## 3. Known Bugs / Issues

*   **ML API Crash on Invalid Images:** If a completely empty or non-image file is sent to the Python API, OpenCV might fail to decode it. (Partially mitigated by recent `try/except` blocks in `main.py`).
*   **Webpack Deprecation Warnings:** The 3D Workspace (`blueprint-ai-frontend`) throws Webpack dev server deprecation warnings (`onAfterSetupMiddleware`, `onBeforeSetupMiddleware`) on startup. This is harmless but pollutes terminal logs.
*   **Cross-Origin localStorage limits:** Initially caused bugs when transferring data between ports 5173 and 3000. Resolved by moving to URL params and `postMessage`, but requires keeping the parent window open in some cases.

## 4. Next Steps

1.  **Build Room Labeling UI:** Update `BlueprintAnalysis.jsx` to let users assign names to the walls returned by the ML model.
2.  **Build 3D Vastu Overlays:** Modify the Three.js app to draw colored floor grids representing the 8 compass zones.
3.  **Provide Training Script:** Deliver the standalone `train_room_model.py` script so it can be run on the RTX 4050 laptop to begin training the Room Segmentation UNet.

## 5. File Locations

*   **Main Application & Node.js Backend:**
    `c:\Users\Lenovo\Desktop\final_year_frontend\`
    *(React Vite on port 5173, Express API on port 5000)*
*   **3D Workspace (ArchVision):**
    `c:\Users\Lenovo\Desktop\blueprint-ai-frontend\`
    *(Create React App / Three.js on port 3000)*
*   **Machine Learning API:**
    `e:\house-designer-api (2)\house-designer-api\`
    *(Python FastAPI on port 8000)*
*   **Startup Script:**
    `c:\Users\Lenovo\Desktop\START_ALL_SERVICES.bat`
