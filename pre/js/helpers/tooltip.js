/*
* FUNCIONES TOOLTIP
*/
function getInTooltip(tooltip) {
    tooltip.style('display','block').style('opacity', 1);
}

function getOutTooltip(tooltip) {
    tooltip.style('display','none').style('opacity', 0);
}

function positionTooltip(event, tooltip) {
    let x = event.pageX;
    let y = event.pageY;

    //Tamaño
    let ancho = parseInt(tooltip.style('width'));
    
    let distanciaAncho = isNaN(ancho) ? 100 : ancho;

    //Posición
    let left = window.innerWidth / 2 > x ? 'left' : 'right';
    let top = document.getElementsByClassName('main')[0].clientHeight / 2 > y ? 'top' : 'bottom';
    
    let mobile = window.innerWidth < 525 ? -30 : 10;
    let horizontalPos = left == 'left' ? 20 : - distanciaAncho + mobile;
    let verticalPost = top == 'bottom' ? -120 : 12.5;

    tooltip.style('top', y + verticalPost + 'px');
    tooltip.style('left', (x + horizontalPos) + 'px');
}

export {
    getInTooltip,
    getOutTooltip,
    positionTooltip
}