// ---- galeria.js (poprawiona wersja) ----

const overlay = document.createElement('div');
overlay.id = 'lightbox-overlay';
overlay.innerHTML = `
  <span id="lightbox-close" class="lightbox-close">&times;</span>
  <img id="lightbox-image" src="" alt="">
  <div id="lightbox-caption"></div>
  <span id="lightbox-prev" class="lightbox-nav">&#10094;</span>
  <span id="lightbox-next" class="lightbox-nav">&#10095;</span>
`;
document.body.appendChild(overlay);

const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.getElementById('lightbox-close');
const preveBtn = document.getElementById('lightbox-prev');
const nexteBtn = document.getElementById('lightbox-next');

let currentIndex = 0;
let currentGalleryImages = [];

function showOverlay() {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function hideOverlay() {
    overlay.classList.add('hiding');
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.classList.remove('hiding');
        overlay.style.display = 'none';
    }, 300);
}

let scale = 1;
let translateX = 0;
let translateY = 0;

function applyTransform() {
    lightboxImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function resetTransform() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    lightboxImage.style.transform = '';
}

/* clamp translate so image doesn't drift too far */
function clampTranslate() {
    if (!lightboxImage.complete) return;
    const containerW = overlay.clientWidth;
    const containerH = overlay.clientHeight;
    const imgW = lightboxImage.clientWidth;
    const imgH = lightboxImage.clientHeight;
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const maxX = Math.max(0, (scaledW - containerW) / 2);
    const maxY = Math.max(0, (scaledH - containerH) / 2);

    translateX = Math.max(-maxX, Math.min(maxX, translateX));
    translateY = Math.max(-maxY, Math.min(maxY, translateY));
}

/* show image and reset transforms */
function showImage(index, direction = 'right') {
    const item = currentGalleryImages[index];
    if (!item) return;

    lightboxImage.classList.remove('show', 'enter-left', 'enter-right');

    const enterClass = direction === 'right' ? 'enter-right' : 'enter-left';
    lightboxImage.classList.add(enterClass);

    setTimeout(() => {
        // reset transforms before loading new src
        resetTransform();

        lightboxImage.src = item.src;
        lightboxCaption.textContent = item.dataset.caption || item.alt || '';
        currentIndex = index;

        lightboxImage.onload = () => {
            // make sure transforms are reset visually after load
            resetTransform();
            lightboxImage.classList.remove('enter-left', 'enter-right');
            lightboxImage.classList.add('show');
        };
    }, 100);
}

// Kliknięcie miniatury
document.querySelectorAll('.gallery-image').forEach(img => {
    img.addEventListener('click', e => {
        const clickedImg = e.currentTarget;
        const gallery = clickedImg.closest('.gallery');
        currentGalleryImages = Array.from(gallery.querySelectorAll('.gallery-image'));
        currentIndex = currentGalleryImages.indexOf(clickedImg);

        // ukryj strzałki, jeśli tylko jedno zdjęcie
        if (currentGalleryImages.length <= 1) {
            preveBtn.style.display = "none";
            nexteBtn.style.display = "none";
        } else {
            preveBtn.style.display = "block";
            nexteBtn.style.display = "block";
        }

        showOverlay();
        showImage(currentIndex);
    });
});

// Nawigacja
preveBtn.addEventListener('click', () => {
    const newIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    showImage(newIndex, 'left');
});
nexteBtn.addEventListener('click', () => {
    const newIndex = (currentIndex + 1) % currentGalleryImages.length;
    showImage(newIndex, 'right');
});

// Zamknięcie
closeBtn.addEventListener('click', hideOverlay);
overlay.addEventListener('click', e => {
    if (e.target === overlay) hideOverlay();
});
document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('show')) return;
    if (e.key === 'Escape') hideOverlay();
    if (e.key === 'ArrowRight') nexteBtn.click();
    if (e.key === 'ArrowLeft') preveBtn.click();
});

// --- DOTYK / MYSZ: pinch, pan, swipe ---

let touchStartX = 0;
let touchStartY = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let initialDistance = 0;
let isPinching = false;
let isMouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;

/* Utility: distance between two touches */
function getDistance(t0, t1) {
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/* TOUCH handlers (passive: false so we can preventDefault) */
overlay.addEventListener('touchstart', function(e) {
    if (!overlay.classList.contains('show')) return;

    if (e.touches.length === 2) {
        isPinching = true;
        initialDistance = getDistance(e.touches[0], e.touches[1]);

        // set last center point for panning reference
        lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1) {
        isPinching = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        lastTouchX = touchStartX;
        lastTouchY = touchStartY;
    }
}, { passive: false });

overlay.addEventListener('touchmove', function(e) {
    if (!overlay.classList.contains('show')) return;
    if (e.touches.length === 2) {
        // PINCH -> zoom
        e.preventDefault();
        const newDist = getDistance(e.touches[0], e.touches[1]);
        const newScale = Math.min(Math.max(1, (newDist / initialDistance) * scale), 4); // relative zoom
        // We compute scale relative to initial pinch — to be simpler, combine current scale and ratio
        // Better approach: compute ratio = newDist / initialDistance and set scale = clamp(ratio * startScale)
        // For simplicity we use immediate ratio-based update:
        const ratio = newDist / initialDistance;
        scale = Math.min(Math.max(1, ratio * (scale || 1)), 4);
        // update last center for possible panning
        lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        clampTranslate();
        applyTransform();
    } else if (e.touches.length === 1) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = x - lastTouchX;
        const dy = y - lastTouchY;

        // if zoomed -> pan the image
        if (scale > 1) {
            e.preventDefault();
            translateX += dx;
            translateY += dy;
            clampTranslate();
            applyTransform();
            lastTouchX = x;
            lastTouchY = y;
        } else {
            // not zoomed -> horizontal swipes should be captured to prevent page scroll
            if (Math.abs(dx) > Math.abs(dy)) {
                e.preventDefault(); // prevent page horizontal/vertical scrolling
            }
            lastTouchX = x;
            lastTouchY = y;
        }
    }
}, { passive: false });

overlay.addEventListener('touchend', function(e) {
    if (!overlay.classList.contains('show')) return;

    // if it was a pinch and now less than 2 touches, stop pinching
    if (e.touches && e.touches.length < 2) {
        isPinching = false;
    }

    // if scale === 1 -> interpret as swipe (change image)
    if (scale === 1) {
        // changedTouches may contain the last touch point
        const ct = e.changedTouches && e.changedTouches[0];
        if (!ct) return;
        const dx = ct.clientX - touchStartX;
        const dy = ct.clientY - touchStartY;

        // threshold and horizontal-dominant gesture
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                // left swipe -> next
                if (currentGalleryImages.length > 1) {
                    const newIndex = (currentIndex + 1) % currentGalleryImages.length;
                    showImage(newIndex, 'right');
                }
            } else {
                // right swipe -> prev
                if (currentGalleryImages.length > 1) {
                    const newIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
                    showImage(newIndex, 'left');
                }
            }
        }
    } else {
        // when finishing a pan/zoom, clamp to valid bounds
        clampTranslate();
        applyTransform();
    }
}, { passive: false });

overlay.addEventListener('touchcancel', function() {
    isPinching = false;
}, { passive: false });

/* MOUSE fallback for desktop testing (simulate touch behaviors) */
overlay.addEventListener('mousedown', function(e) {
    if (!overlay.classList.contains('show')) return;
    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
    e.preventDefault();
});

window.addEventListener('mousemove', function(e) {
    if (!isMouseDown) return;
    if (!overlay.classList.contains('show')) return;
    const x = e.clientX;
    const y = e.clientY;
    const dx = x - lastTouchX;
    const dy = y - lastTouchY;

    if (scale > 1) {
        translateX += dx;
        translateY += dy;
        clampTranslate();
        applyTransform();
    } else {
        // not zoomed: do nothing on mousemove (we'll detect swipe on mouseup)
        // but prevent selection/scrolling
    }

    lastTouchX = x;
    lastTouchY = y;
    e.preventDefault();
});

window.addEventListener('mouseup', function(e) {
    if (!overlay.classList.contains('show')) return;

    if (!isMouseDown) return;
    isMouseDown = false;

    if (scale === 1) {
        const dx = e.clientX - mouseStartX;
        const dy = e.clientY - mouseStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                if (currentGalleryImages.length > 1) {
                    const newIndex = (currentIndex + 1) % currentGalleryImages.length;
                    showImage(newIndex, 'right');
                }
            } else {
                if (currentGalleryImages.length > 1) {
                    const newIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
                    showImage(newIndex, 'left');
                }
            }
        }
    } else {
        clampTranslate();
        applyTransform();
    }
    e.preventDefault();
});

// Ensure transforms reset whenever new image is shown (also if user clicks prev/next)
lightboxImage.addEventListener('load', () => {
    resetTransform();
});

// Adjust arrows visibility when overlay opens (in case of dynamic galleries)
overlay.addEventListener('transitionend', () => {
    if (overlay.classList.contains('show')) {
        if (!currentGalleryImages || currentGalleryImages.length <= 1) {
            preveBtn.style.display = 'none';
            nexteBtn.style.display = 'none';
        } else {
            preveBtn.style.display = 'block';
            nexteBtn.style.display = 'block';
        }
    }
});

// Caption observer (preserved)
document.addEventListener("DOMContentLoaded", function() {
    const caption = document.getElementById("lightbox-caption");

    if (caption) {
        const observer = new MutationObserver(() => {
            if (caption.textContent.trim() === "") {
                caption.style.background = "none";
                caption.style.padding = "0";
            } else {
                caption.style.background = "rgba(0,0,0,0.6)";
                caption.style.padding = "6px 10px";
            }
        });

        observer.observe(caption, { childList: true, subtree: true, characterData: true });
    }
});

// 🔧 Fix na mobilne 100vh (pasek URL)
// --- Robust mobile viewport height sync for the lightbox overlay ---
// add at the end of galeria.js (after overlay is defined)

let __autoVHInterval = null;

function getVisibleHeight() {
    // prefer visualViewport if available (gives visual viewport height)
    if (window.visualViewport && typeof window.visualViewport.height === 'number') {
        return window.visualViewport.height;
    }
    // fallback
    return window.innerHeight || document.documentElement.clientHeight;
}

function updateVH() {
    const vhPx = getVisibleHeight();
    // set CSS var for general use
    document.documentElement.style.setProperty('--vh', `${vhPx * 0.01}px`);
    // also set overlay height immediately in pixels to avoid timing glitches
    if (overlay) {
        overlay.style.height = `${vhPx}px`;
        // force reflow in case browser delays repaint
        overlay.getBoundingClientRect();
    }
}

// start listening / syncing while overlay is shown
function startOverlayVHSync() {
    updateVH();

    // attach visualViewport events if available
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateVH);
        window.visualViewport.addEventListener('scroll', updateVH);
    }

    // generic fallbacks
    window.addEventListener('resize', updateVH);
    window.addEventListener('orientationchange', updateVH);
    // page scroll can change visual viewport on some browsers
    window.addEventListener('scroll', updateVH, { passive: true });

    // short interval to catch the address-bar hide/show animation (stops when overlay closed)
    if (!__autoVHInterval) {
        __autoVHInterval = setInterval(updateVH, 180); // tune: 100-250ms
    }
}

function stopOverlayVHSync() {
    if (window.visualViewport) {
        try {
            window.visualViewport.removeEventListener('resize', updateVH);
            window.visualViewport.removeEventListener('scroll', updateVH);
        } catch (e) {}
    }
    window.removeEventListener('resize', updateVH);
    window.removeEventListener('orientationchange', updateVH);
    window.removeEventListener('scroll', updateVH, { passive: true });

    if (__autoVHInterval) {
        clearInterval(__autoVHInterval);
        __autoVHInterval = null;
    }

    // remove inline overlay height so CSS fallback (calc(var(--vh) * 100)) can work again
    if (overlay) {
        overlay.style.height = '';
    }
}

// integrate with existing show/hide
const _oldShowOverlay = showOverlay;
const _oldHideOverlay = hideOverlay;

// override showOverlay to start sync immediately
showOverlay = function() {
    // call original behaviours (set display + animation)
    overlay.style.display = 'flex';
    // immediate sync then start continuous sync
    updateVH();
    startOverlayVHSync();
    requestAnimationFrame(() => overlay.classList.add('show'));
};

// override hideOverlay to stop sync and cleanup
hideOverlay = function() {
    overlay.classList.add('hiding');
    overlay.classList.remove('show');
    // stop syncing first
    stopOverlayVHSync();
    setTimeout(() => {
        overlay.classList.remove('hiding');
        overlay.style.display = 'none';
        // ensure transform/height reset (safety)
        overlay.style.height = '';
    }, 300);
};

// also update on load just in case overlay is shown by other logic
updateVH();