document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-up, .animate-fade').forEach(el => {
        observer.observe(el);
    });

    // Rapid Trigger Interactive Demo Logic
    const stem = document.getElementById('switch-stem');
    const actuationLine = document.getElementById('actuation-line');
    const resetLine = document.getElementById('reset-line');
    const statusIndicator = document.getElementById('status-indicator');
    const depthText = document.getElementById('current-depth');
    
    // Switch physical bounds mapping
    // total travel 4.0mm. UI travel: top 10% to 90% (80% travel distance)
    const MAX_MM = 4.0;
    let currentDepthMM = 0;
    let isKeyDown = false;
    let targetDepth = 0; // for smooth animation
    let lastDir = 0; // 1 for down, -1 for up
    
    let actuationPoint = 0.1; // initial default actuation point
    let resetPoint = 0.0;     // initial default
    const RAPID_SENSITIVITY = 0.15; // 0.15mm sensitivity for rapid trigger

    // Update UI elements based on current mm values
    function updateUI() {
        // map 0~4.0mm to 10%~90% top
        const topPercent = 10 + (currentDepthMM / MAX_MM) * 80;
        stem.style.top = topPercent + '%';
        
        const actPercent = 10 + (actuationPoint / MAX_MM) * 80;
        actuationLine.style.top = actPercent + '%';
        
        const resetPercent = 10 + (resetPoint / MAX_MM) * 80;
        resetLine.style.top = resetPercent + '%';
        
        depthText.textContent = currentDepthMM.toFixed(1) + ' mm';
        
        // Logical evaluation
        if (currentDepthMM >= actuationPoint) {
            statusIndicator.textContent = 'ACTIVE';
            statusIndicator.className = 'status active';
        } else if (currentDepthMM <= resetPoint) {
            statusIndicator.textContent = 'IDLE';
            statusIndicator.className = 'status idle';
        }
    }

    // Animation loop
    function animate() {
        // smooth approach to targetDepth
        const diff = targetDepth - currentDepthMM;
        if (Math.abs(diff) > 0.01) {
            const step = diff * 0.15; // ease factor
            const newDepth = currentDepthMM + step;
            
            // detecting direction change for rapid trigger
            const currentDir = step > 0 ? 1 : -1;
            
            if (currentDir === -1) { 
                // going up (releasing key)
                // Dynamic reset point follows the key up
                if (statusIndicator.textContent === 'ACTIVE') {
                    resetPoint = Math.max(0, currentDepthMM - RAPID_SENSITIVITY);
                }
            } else if (currentDir === 1) {
                // going down (pressing key)
                // Dynamic actuation point follows the key down
                if (statusIndicator.textContent === 'IDLE') {
                    actuationPoint = Math.min(MAX_MM, currentDepthMM + RAPID_SENSITIVITY);
                }
            }
            
            currentDepthMM = newDepth;
            updateUI();
        }
        
        requestAnimationFrame(animate);
    }
    
    // start loop
    animate();
    updateUI();

    // Event Listeners for Spacebar
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            if (!isKeyDown) {
                isKeyDown = true;
                targetDepth = MAX_MM; // go to bottom
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            isKeyDown = false;
            targetDepth = 0; // go to top
        }
    });
    
    // Mouse events for the switch stem itself
    stem.addEventListener('mousedown', () => {
        isKeyDown = true;
        targetDepth = MAX_MM;
    });
    
    document.addEventListener('mouseup', () => {
        isKeyDown = false;
        targetDepth = 0;
    });
    
    stem.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isKeyDown = true;
        targetDepth = MAX_MM;
    });
    
    document.addEventListener('touchend', () => {
        isKeyDown = false;
        targetDepth = 0;
    });
});
