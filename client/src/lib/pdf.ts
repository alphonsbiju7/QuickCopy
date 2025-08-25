import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

// Tell pdfjs where the worker file is
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default pdfjsLib;
