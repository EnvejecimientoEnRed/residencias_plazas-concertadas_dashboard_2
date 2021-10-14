let viewportHeight = window.innerHeight;
let viewportWidth = window.innerWidth;

function isMobile() {
	return viewportWidth < 768;
}

function isSmallMobile() {
	return viewportWidth < 525;
}

function isDevice() { //Mejorar nombre
    return viewportWidth < 993;
}

function isElementInViewport(el) {
    var scroll = window.scrollY || window.pageYOffset
    var boundsTop = el.getBoundingClientRect().top + scroll
    
    var viewport = {
        top: scroll,
        bottom: scroll + viewportHeight,
    }
    
    var bounds = {
        top: Math.floor(boundsTop) + el.offsetHeight,
        bottom: boundsTop + el.clientHeight,
    }

    return ( (viewport.bottom > bounds.top) && (viewport.top < bounds.bottom) ) 
}

function percentageOfElement(el){
    // Get the relevant measurements and positions
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY || window.pageYOffset;
    const elementOffsetTop = el.offsetTop;
    const elementHeight = el.offsetHeight;

    // Calculate percentage of the element that's been seen
    const distance = scrollTop + viewportHeight - elementOffsetTop;
    let percentage = Math.round(distance / ((viewportHeight + elementHeight) / 100));

    // Restrict the range to between 0 and 100
    return Math.min(100, Math.max(0, percentage));
}

function getNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function numberWithCommas(x) {
    return parseFloat(x).toFixed(1).toString().replace(/\./g, ',');       
}

function numberWithCommas2(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");       
}

export { isMobile, isSmallMobile, isDevice, isElementInViewport, percentageOfElement, getNumberWithCommas, numberWithCommas, numberWithCommas2 };