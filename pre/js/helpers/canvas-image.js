import html2canvas from 'html2canvas';
let innerCanvas;

function setChartCanvas() {
    html2canvas(document.querySelector("#chartBlock"), {width: document.querySelector("#chartBlock").clientWidth, height: document.querySelector("#chartBlock").clientHeight, imageTimeout: 12000, useCORS: true}).then(canvas => { innerCanvas = canvas; });
}

function setChartCanvasImage() {    
    var image = innerCanvas.toDataURL();
    // Create a link
    var aDownloadLink = document.createElement('a');
    // Add the name of the file to the link
    aDownloadLink.download = 'residencias_plazas-concertadas_dashboard.png';
    // Attach the data to the link
    aDownloadLink.href = image;
    // Get the code to click the download link
    aDownloadLink.click();
}

export { setChartCanvas, setChartCanvasImage };