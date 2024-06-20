/*

A Search For The Heart

Jer Thorp
jer.thorp@hey.com
Summer, 2024

*/

let v;
let qSheet;
let qPage;

let currentPageElement;
let currentVideo;
let currentPage = -1;
let currentQ = 0;
let startTime;
let lastTime;

let scroller;

let timing = false;

let lang = "en";

let piled1 = false;
let piled2 = false;
let piled3 = false;

let xml;

let illiFactor = 1440.0 / 981.0;

let static = false;

//Get lang parameter
window.onload = function(){

  let langs = "en,es"

  try {
    let blang = navigator.language.split("-")[0];
    if (langs.indexOf(blang) != -1) lang = blang;
  } catch(e) {

  }

  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let qlang = urlParams.get('lang');
  if (qlang) lang = qlang;

  document.body.setAttribute("lang", lang);

  let qstatic = urlParams.get('static');
  if (qstatic) {
    static = (qstatic == "true");
  }
};

//Preload the queue sheet for the animations
function preload() {
  qSheet = loadJSON("qSheet.json");
}


function setup() {

    if (typeof(ResizeObserver) == "undefined" || static) {
      //Show the page captions
      handleStepEnter({index:1});
      handleStepEnter({index:2});
      handleStepEnter({index:3});
      handleStepEnter({index:4});
      handleStepEnter({index:5});
      handleStepEnter({index:6});
      handleStepEnter({index:23});

      //show the frameset
      document.querySelector("#frameset").style.opacity = 1;
    } else {
      //Remove no-js tags
      document.querySelector("#frameset").classList.remove("no-js");
      document.querySelectorAll(".frame").forEach(f => {
        f.classList.remove("no-js");
      });
      document.querySelectorAll(".captionOut").forEach(f => {
        f.classList.remove("no-js");
      }); 

      //Remove static only frames
      document.querySelectorAll(".staticOnly").forEach(f => {
        f.remove();
      });

      //Run through the q sheet and make elements for each, and set up timers
      qSheet.queues.forEach((q) => {

        let d = document.querySelector("#frame" + q.pageNum);

        if (d.getAttribute("lang") == lang) {
          d.q = q;
          q.time = 0;
            //preload bubbles
            if (q.bubbleSet) {
              q.bubbleSet.forEach(b => {
                preloadImage(b.url);
              });
            }
          
            //Place a page element for each q page
            let p = processPage(q, d);
            processQ(q.queues[0], p, true);
            q.queues.shift();
            p.currentQ++;
        }
      });

      //Initialize the scroll library
      init();
    }



  //Set the timer value - this gets set again so may be redundant but I'm leaving it for now
  lastTime = new Date();

  
}

function draw() {
  if (timing) {
    
  }

  doTimer();
}

function preloadImage(url)
{
    var img=new Image();
    img.src=url;
}

function mousePressed() {}

function keyPressed() {
  if (key == "s") setLanguage("es");
  if (key == "e") setLanguage("en");
  if (key == " ") {
  }
}

function resetTimer() {
  startTime = new Date();
  timing = true;
  lastTime = new Date();
}

function doTimer() {
  let now = new Date();
  let ft = (now.getTime() - lastTime.getTime()) / 1000;

  let pages = document.querySelectorAll(".page");
  pages.forEach(p => {
    let isIn = isElementInViewport(p);
    if (isIn) {
      p.time += ft;
      if (p.currentQ < p.q.queues.length) {
        if (p.time > parseFloat(p.q.queues[p.currentQ].time)) {
          processQ(p.q.queues[p.currentQ], p.p5);
          p.currentQ++;
        }
      }
    }
  });

  lastTime = now;
}

//Scaling stuff
function doScaleAll() {
  let cwraps = document.querySelectorAll(".frame");

  cwraps.forEach(cw => {
    doScale(cw);
  });
}

function doScale(_cw) {
  if (_cw.getAttribute("lang") == lang) {
    let fw = _cw.getBoundingClientRect().width;
    let sc = fw/1920 * illiFactor * 1.25;

    let cw = _cw.querySelector(".contentWrap");
    cw.style.transform = "scale(" + sc +  ")";
  }

}

window.onresize = doScaleAll;

function isElementInViewport (el) {

    var rect = el.getBoundingClientRect();
    let hf = ((windowWidth * 1) / 1920) * illiFactor;
    var h = (rect.bottom - rect.top) * hf;
    var middle = rect.top + (h / 2);

    return (
        (middle >= 0 && middle <= (window.innerHeight || document.documentElement.clientHeight))
    );
}

function loadVideoTrans(_url1, _url2, _offset, _dims, _elt, _slug) {
  
  let vh = createDiv(`<video id="` + _slug + `" muted playsinline>
  <source 
    src="` + _url1 + `" 
    type="video/mp4; codecs="hvc1"">
  <source 
    src="` + _url2 + `" 
    type="video/webm">
  </video>`);
  vh.class("videoWrapperTrans");

  vh.parent(_elt.contentWrap);
  gsap.to(vh.elt, {opacity:1})

if (_dims.scale) 

  vh.elt.style.left = _offset.x + "px";
  vh.elt.style.top = _offset.y + "px";
  vh.elt.style.width = _dims.w + "px";
  vh.elt.style.height = _dims.h + "px";
  
  if (_dims.scale) vh.elt.style.transform = "scale(" + _dims.scale + ")"
  _elt.mainVideo = document.querySelector("#" + _slug);
  _elt.mainVideo.style.opacity = 0;
}


function addBubbles(_i, _elt) {
  let bi = createImg(_elt.q.bubbleSet[_i].url, 'speech bubbles');
  bi.class("bubbleImage");
  _elt.bubbleWrap.child(bi);
}

function loadVideo(_url, _elt, _isFirst, _desc) {

  let vh = createDiv();
  vh.class(_isFirst ? "videoWrapper frameBack":"videoWrapper");
  vh.parent(_elt.contentWrap);
  _elt.mediaWrap = vh;

  let v = createDiv(`<video id="currentvideo" aria-label="` + _desc + `" muted playsinline>
  <source 
    src="` + _url + `" 
    type="video/mp4; codecs="hvc1"">
  </video>`);

  v.parent(vh);

  vh.style("opacity", 0);
  gsap.to(vh.elt, {opacity:1, duration:2});

  _elt.mainVideo = v.elt.querySelector('#currentvideo');

}

function loadImageQ(_q, _elt, _isFirst) {
  
  let vh = createDiv("<div class='imageDiv'><img src=" + _q.url + "></div>");
  vh.class(_isFirst ?"imageWrapper frameBack":"imageWrapper");
  vh.parent(_q.isBack ? _elt.contentWrap:_elt.contentWrap);


   if (_q.pos) {
    vh.elt.style.left = _q.pos.x + "px";
    vh.elt.style.top = _q.pos.y + "px";
   } else {
    _elt.mediaWrap = vh;
   }
   if (_q.animate) {
    vh.style("opacity", 0);
    if (_q.animate.indexOf("fade") != -1) {
      gsap.to(vh.elt, {opacity:1});
    }
   }
  
}

function imageDrift(_q, _elt) {
  let bi = _elt.elt.querySelector(".imageWrapper");
  gsap.to(bi, { left: _q.amount, ease: "power1.in", duration: _q.atime, delay: _q.delay });
}

function capDrift(_q, _elt) {
  let bi = _elt.elt.querySelector(".capwrap");
  let bw = _elt.elt.querySelector(".bubblewrap");
  let vi = _elt.elt.querySelector(".videoWrapperTrans");
  gsap.to(vi, { opacity:1, delay: 16.1, duration:1 });
  gsap.to(vi, { left: "-=50%", ease: "power1.in", duration: 10, delay: 10 });
  gsap.to(bi, { left: "-=50%", ease: "power1.in", duration: 10, delay: 10 });
  gsap.to(bw, { left: "-=50%", ease: "power1.in", duration: 10, delay: 10 });
}

function processQ(_q, _elt, _isFirst) {
  let t = _q.type;
  switch (t) {
    case "caption":
      addCaption(_q.caption, _elt);
      break;
    case "bubbles":
      addBubbles(_q.index, _elt);
      break;
    case "videoLoad":
      loadVideo(_q.url, _elt, _isFirst, _q.description ? _q.description:"A video is playing.");
      break;
    case "videoLoadTrans":
      loadVideoTrans(_q.url, _q.url2, _q.offset, _q.dims, _elt, _q.slug);
      break;
    case "videoPlay":
      _elt.mainVideo.play();
      console.log(_elt.mainVideo);
      gsap.to(_elt.mainVideo, {opacity:1})

      break;
    case "imageLoad":
      loadImageQ(_q, _elt, _isFirst);
      break;
    case "imageDrift":
      imageDrift(_q, _elt);
      break;
    case "capDrift":
      capDrift(_q, _elt);
      break;
  }
}

function setLanguage(_code) {
  let captions = selectAll(".caption");
  captions.forEach((c) => {
    try {
      c.html(c.elt.params["text_" + _code]);
    } catch (e) {

    }
  });
  lang = _code;
}


function offset(el) {
  var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}


function processPage(_q, _frame) {
  let pe = createDiv();
  pe.parent(_frame);
  pe.class("page");
  pe.q = _q;
  pe.elt.q = _q;
  pe.elt.time = 0;
  pe.elt.currentQ = 0;
  pe.elt.p5 = pe;

  //content holder - this gets scaled
  let contentWrap = createDiv();
  contentWrap.class("contentWrap");
  contentWrap.parent(pe);
  pe.contentWrap = contentWrap;
  contentWrap.q = _q;
  contentWrap.elt.q = _q;
  contentWrap.elt.p5 = contentWrap;

  //bubble wrapper
  let bubbleWrap = createDiv();
  bubbleWrap.class("bubblewrap");
  bubbleWrap.parent(contentWrap);
  pe.bubbleWrap = bubbleWrap;

  //caption wrapper
  let capWrap = createDiv();
  capWrap.class("capwrap");
  capWrap.parent(contentWrap);
  pe.capWrap = capWrap;

  gsap.to(pe.elt, { opacity: 1, ease:"power1.out" });

  qPage = _q;

  //doScale(contentWrap);

  return(pe);
}

function addCaption(_params, _elt) {
  let e = createDiv(_params["text_" + lang]);
  e.parent(_elt.capWrap);
  e.class("caption" + (_params.extra ? (" " + _params.extra) : "" ));
  e.elt.params = _params;

  e.elt.style.left = (_params.pos.x) + "px";
  e.elt.style.top = (_params.pos.y) + "px";
  e.elt.style.width = ((_params["text_" + lang] != "muchísimas") ? _params.width : 106)+ "px";


  if (_params.transform) {
    e.elt.style.transform = _params.transform;
  }

  gsap.to(e.elt, { opacity: 1, ease:"power1.out" });
}

// scrollama event handlers
function handleStepEnter(response) {

  if (response.index < 9) {
    hideComic();
  }

  if (response.index == 1) {
    gsap.to(document.querySelector("#mcclellanCaption"), {
      opacity: 1,
      rotation: "-2deg",
      duration: 1,
    });
  }
  if (response.index == 2) {
    gsap.to(document.querySelector("#yooCaption"), {
      opacity: 1,
      rotation: "2deg",
      duration: 1,
    });
  }
  if (response.index == 3) {
    gsap.to(document.querySelector("#mullenCaption"), {
      opacity: 1,
      rotation: "2deg",
      duration: 1,
    });
  }
  if (response.index == 4 && !piled3) {
    piled3 = true;
    let i = 0;
    document.querySelectorAll(".pile3").forEach((c) => {
      gsap.to(c, { opacity: 1, delay: 0.5 + i * 0.25, top: "+=50px" , ease:"power1.out"});
      i++;
    });
  }
  if (response.index == 5 && !piled1) {
    piled1 = true;
    let i = 0;
    document.querySelectorAll(".pile").forEach((c) => {
      gsap.to(c, { opacity: 1, delay: 0.5 + i * 0.5, top: "+=50px", ease:"power1.out" });
      i++;
    });
  }
  if (response.index == 6) {
    if (!piled2) {
      piled2 = true;
      let i = 0;
      let times = [0, 0.5, 1, 2];
      document.querySelectorAll(".pile2").forEach((c) => {
        gsap.to(c, { opacity: 1, delay: times[i] , ease:"power1.out" });
        i++;
      });
    }

    gsap.to(document.querySelector("#triggerCaption"), { opacity: 1, delay: 4 , ease:"power1.out" });
  }

  if (response.index == 22) {
    hideComic();
  }

  if (response.index == 23) {
    gsap.to(document.querySelector("#endCaption"), {
      opacity: 1,
      rotation: "2deg",
      duration: 1,
    });
  }

  if (response.element) {
    if (response.element.classList.contains("frame")) {
      if (document.querySelector("#frameset").style.opacity == 0) {
        gsap.to(document.querySelector("#frameset"), { opacity: 1, delay: 0 , ease:"power1.out" });
      }
      timing = true;
      response.element.timing = true;
      lastTime = new Date();
    } else {
      if (document.querySelector("#frameset").style.opacity == 1) {
        gsap.to(document.querySelector("#frameset"), { opacity: 0, delay: 0 , ease:"power1.out" });
      }
    }
  }
}

function handleStepExit(response) {
  if (response.element.classList.contains("frame")) {
    response.element.timing = false;
  }

}

function hideComic() {
  if (timing) {
      timing = false;
      gsap.to(document.querySelector(".shade"), {
        opacity: 0,
        duration: 1,
      });

      let i = 0;
      document.querySelectorAll(".pile2").forEach((c) => {
        gsap.to(c, { opacity: 1, delay: 0.5 + i * 0.1,  ease:"power1.out" });
        i++;
      });

      gsap.to(document.querySelector("#triggerCaption"), { opacity: 1, delay: 0, ease:"power1.out"  });
    }
}

//Scrolling stuff
function init() {
  doScaleAll();
  scroller = scrollama();
  // 1. setup the scroller with the bare-bones options
  // 		this will also initialize trigger observations
  // 2. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: ".content .scrollStep",
      debug: false,
      offset: 0.5,
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(handleStepExit);
}

