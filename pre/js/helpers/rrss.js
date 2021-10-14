function setRRSSLinks() {
    let urlPage = window.location.href;

    //Facebook
    let shareFB = document.getElementById("shareFB")
    let fbHref = "https://www.facebook.com/sharer/sharer.php?u="+urlPage
    shareFB.setAttribute("href",fbHref)

    //Twitter
    let shareTW = document.getElementById("shareTW")
    let twText = shareTW.getAttribute("data-text")
    let twHref = "https://twitter.com/intent/tweet?url="+urlPage+"&text="+twText+"&original_referer="+urlPage
    shareTW.setAttribute("href",twHref)

    //Linkedin
    let shareLK = document.getElementById("shareLK")
    let lkText = shareLK.getAttribute("data-text")
    let lkHref = "https://www.linkedin.com/shareArticle?mini=true&url="+urlPage+"&title="+lkText+"&summary=&source="
    shareLK.setAttribute("href",lkHref)

    //WhatsApp
    let shareWA = document.getElementById("shareWA")
    let waText = shareWA.getAttribute("data-text")
    let waHref = "https://api.whatsapp.com/send?text="+waText+" "+urlPage
    shareWA.setAttribute("href",waHref)
}

export { setRRSSLinks };