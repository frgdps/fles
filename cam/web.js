class AVTestStudio {
            constructor() {
                this.audioContext = null;
                this.analyser = null;
                this.microphone = null;
                this.gainNode = null;
                this.echoGainNode = null;
                this.dataArray = null;
                this.animationId = null;
                this.stream = null;
                this.videoStream = null;
                this.echoEnabled = false;
                this.currentCamera = null;
                this.cameras = [];
                this.microphones = [];
                
                this.initializeElements();
                this.setupEventListeners();
                this.setupCanvas();
                this.enumerateDevices();
            }

            initializeElements() {
                // Camera elements
                this.webcam = document.getElementById('webcam');
                this.cameraSelect = document.getElementById('cameraSelect');
                this.startCameraBtn = document.getElementById('startCamera');
                this.stopCameraBtn = document.getElementById('stopCamera');
                this.switchCameraBtn = document.getElementById('switchCamera');
                this.takeSnapshotBtn = document.getElementById('takeSnapshot');
                this.qualitySlider = document.getElementById('qualitySlider');
                this.qualityValue = document.getElementById('qualityValue');
                this.recordingIndicator = document.getElementById('recordingIndicator');

                // Audio elements
                this.canvas = document.getElementById('visualizer');
                this.ctx = this.canvas.getContext('2d');
                this.micSelect = document.getElementById('micSelect');
                this.startMicBtn = document.getElementById('startMic');
                this.stopMicBtn = document.getElementById('stopMic');
                this.toggleEchoBtn = document.getElementById('toggleEcho');
                this.testToneBtn = document.getElementById('testTone');
                this.micVolumeSlider = document.getElementById('micVolumeSlider');
                this.micVolumeValue = document.getElementById('micVolumeValue');
                this.echoVolumeSlider = document.getElementById('echoVolumeSlider');
                this.echoVolumeValue = document.getElementById('echoVolumeValue');

                // Status elements
                this.statusMessage = document.getElementById('statusMessage');
            }

            setupEventListeners() {
                // Camera events
                this.startCameraBtn.addEventListener('click', () => this.startCamera());
                this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
                this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
                this.takeSnapshotBtn.addEventListener('click', () => this.takeSnapshot());
                this.qualitySlider.addEventListener('input', (e) => {
                    this.qualityValue.textContent = e.target.value + '%';
                });
                this.cameraSelect.addEventListener('change', (e) => {
                    if (e.target.value) {
                        this.currentCamera = e.target.value;
                        if (this.videoStream) {
                            this.stopCamera();
                            this.startCamera();
                        }
                    }
                });

                // Audio events
                this.startMicBtn.addEventListener('click', () => this.startMicrophone());
                this.stopMicBtn.addEventListener('click', () => this.stopMicrophone());
                this.toggleEchoBtn.addEventListener('click', () => this.toggleEcho());
                this.testToneBtn.addEventListener('click', () => this.playTestTone());
                this.micVolumeSlider.addEventListener('input', (e) => {
                    this.micVolumeValue.textContent = e.target.value + '%';
                    if (this.gainNode) {
                        this.gainNode.gain.value = e.target.value / 100;
                    }
                });
                this.echoVolumeSlider.addEventListener('input', (e) => {
                    this.echoVolumeValue.textContent = e.target.value + '%';
                    if (this.echoGainNode) {
                        this.echoGainNode.gain.value = e.target.value / 100;
                    }
                });
                this.micSelect.addEventListener('change', (e) => {
                    if (e.target.value && this.stream) {
                        this.stopMicrophone();
                        this.startMicrophone();
                    }
                });
            }

            setupCanvas() {
                const resizeCanvas = () => {
                    const container = this.canvas.parentElement;
                    this.canvas.width = container.clientWidth;
                    this.canvas.height = container.clientHeight;
                };
                
                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);
            }

            async enumerateDevices() {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    
                    this.cameras = devices.filter(device => device.kind === 'videoinput');
                    this.microphones = devices.filter(device => device.kind === 'audioinput');
                    
                    // Populate camera select
                    this.cameraSelect.innerHTML = '<option value="">Select Camera...</option>';
                    this.cameras.forEach(camera => {
                        const option = document.createElement('option');
                        option.value = camera.deviceId;
                        option.textContent = camera.label || `Camera ${this.cameraSelect.options.length}`;
                        this.cameraSelect.appendChild(option);
                    });
                    
                    // Populate microphone select
                    this.micSelect.innerHTML = '<option value="">Select Microphone...</option>';
                    this.microphones.forEach(mic => {
                        const option = document.createElement('option');
                        option.value = mic.deviceId;
                        option.textContent = mic.label || `Microphone ${this.micSelect.options.length}`;
                        this.micSelect.appendChild(option);
                    });
                    
                    this.updateStatus('Devices enumerated successfully');
                } catch (error) {
                    console.error('Error enumerating devices:', error);
                    this.updateStatus('Error enumerating devices');
                }
            }

            async startCamera() {
                try {
                    const constraints = {
                        video: {
                            deviceId: this.currentCamera ? { exact: this.currentCamera } : undefined,
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            frameRate: { ideal: 30 }
                        }
                    };
                    
                    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
                    this.webcam.srcObject = this.videoStream;
                    
                    this.recordingIndicator.classList.add('active');
                    this.startCameraBtn.classList.add('active');
                    
                    this.updateCameraInfo();
                    this.updateTestResult('cameraAccess', 'success', 'Granted');
                    this.updateTestResult('videoStream', 'success', 'Active');
                    
                    this.updateStatus('Camera started successfully');
                    document.getElementById('cameraStatus').textContent = 'Active';
                    
                    // Start FPS monitoring
                    this.startFPSMonitoring();
                    
                } catch (error) {
                    console.error('Error starting camera:', error);
                    this.updateTestResult('cameraAccess', 'error', 'Denied');
                    this.updateStatus('Error accessing camera: ' + error.message);
                }
            }

            stopCamera() {
                if (this.videoStream) {
                    this.videoStream.getTracks().forEach(track => track.stop());
                    this.videoStream = null;
                    this.webcam.srcObject = null;
                }
                
                this.recordingIndicator.classList.remove('active');
                this.startCameraBtn.classList.remove('active');
                
                document.getElementById('cameraStatus').textContent = 'Inactive';
                document.getElementById('resolution').textContent = '-';
                document.getElementById('fps').textContent = '-';
                document.getElementById('cameraDevice').textContent = '-';
                
                this.updateStatus('Camera stopped');
            }

            async switchCamera() {
                if (this.cameras.length < 2) {
                    this.updateStatus('Only one camera available');
                    return;
                }
                
                const currentIndex = this.cameras.findIndex(cam => cam.deviceId === this.currentCamera);
                const nextIndex = (currentIndex + 1) % this.cameras.length;
                this.currentCamera = this.cameras[nextIndex].deviceId;
                this.cameraSelect.value = this.currentCamera;
                
                if (this.videoStream) {
                    this.stopCamera();
                    this.startCamera();
                }
            }

            takeSnapshot() {
                if (!this.videoStream) {
                    this.updateStatus('Camera not active');
                    return;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = this.webcam.videoWidth;
                canvas.height = this.webcam.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(this.webcam, 0, 0);
                
                // Download snapshot
                const link = document.createElement('a');
                link.download = `snapshot_${new Date().getTime()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                
                this.updateStatus('Snapshot saved');
            }

            async startMicrophone() {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    const constraints = {
                        audio: {
                            deviceId: this.micSelect.value ? { exact: this.micSelect.value } : undefined,
                            echoCancellation: true,
                            noiseSuppression: true,
                            sampleRate: 44100
                        }
                    };
                    
                    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
                    
                    // Create audio nodes
                    this.microphone = this.audioContext.createMediaStreamSource(this.stream);
                    this.analyser = this.audioContext.createAnalyser();
                    this.gainNode = this.audioContext.createGain();
                    this.echoGainNode = this.audioContext.createGain();
                    
                    // Configure analyser
                    this.analyser.fftSize = 256;
                    this.analyser.smoothingTimeConstant = 0.8;
                    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                    
                    // Set initial volumes
                    this.gainNode.gain.value = this.micVolumeSlider.value / 100;
                    this.echoGainNode.gain.value = this.echoVolumeSlider.value / 100;
                    
                    // Connect nodes
                    this.microphone.connect(this.analyser);
                    this.microphone.connect(this.gainNode);
                    
                    if (this.echoEnabled) {
                        this.gainNode.connect(this.echoGainNode);
                        this.echoGainNode.connect(this.audioContext.destination);
                    }
                    
                    this.startMicBtn.classList.add('active');
                    this.startVisualization();
                    
                    this.updateTestResult('micAccess', 'success', 'Granted');
                    this.updateTestResult('audioStream', 'success', 'Active');
                    
                    this.updateStatus('Microphone started successfully');
                    document.getElementById('micStatus').textContent = 'Active';
                    
                    // Get microphone info
                    const track = this.stream.getAudioTracks()[0];
                    const settings = track.getSettings();
                    document.getElementById('micDevice').textContent = track.label || 'Unknown';
                    
                } catch (error) {
                    console.error('Error starting microphone:', error);
                    this.updateTestResult('micAccess', 'error', 'Denied');
                    this.updateStatus('Error accessing microphone: ' + error.message);
                }
            }

            stopMicrophone() {
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
                
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                    this.stream = null;
                }
                
                if (this.audioContext) {
                    this.audioContext.close();
                    this.audioContext = null;
                }
                
                this.microphone = null;
                this.analyser = null;
                this.gainNode = null;
                this.echoGainNode = null;
                
                this.startMicBtn.classList.remove('active');
                this.clearCanvas();
                
                document.getElementById('micStatus').textContent = 'Inactive';
                document.getElementById('inputLevel').textContent = '-';
                document.getElementById('frequency').textContent = '-';
                
                this.updateStatus('Microphone stopped');
            }

            toggleEcho() {
                this.echoEnabled = !this.echoEnabled;
                this.toggleEchoBtn.textContent = `🔊 Echo: ${this.echoEnabled ? 'ON' : 'OFF'}`;
                document.getElementById('echoStatus').textContent = this.echoEnabled ? 'ON' : 'OFF';
                
                if (this.echoEnabled && this.gainNode && this.echoGainNode) {
                    this.gainNode.connect(this.echoGainNode);
                    this.echoGainNode.connect(this.audioContext.destination);
                    this.updateTestResult('echoStatus', 'success', 'Working');
                } else if (this.gainNode && this.echoGainNode) {
                    this.gainNode.disconnect(this.echoGainNode);
                    this.echoGainNode.disconnect(this.audioContext.destination);
                }
                
                this.updateStatus(`Echo ${this.echoEnabled ? 'enabled' : 'disabled'}`);
            }

            playTestTone() {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 440; // A4 note
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 1);
                
                this.updateStatus('Test tone played');
            }

            startVisualization() {
                const animate = () => {
                    if (!this.analyser) return;
                    
                    this.analyser.getByteFrequencyData(this.dataArray);
                    this.draw();
                    this.updateAudioInfo();
                    
                    this.animationId = requestAnimationFrame(animate);
                };
                
                animate();
            }

            draw() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                const barCount = 64;
                const barWidth = this.canvas.width / barCount;
                const barSpacing = 2;
                
                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor(i * this.dataArray.length / barCount);
                    const barHeight = (this.dataArray[dataIndex] / 255) * this.canvas.height * 0.8;
                    const x = i * barWidth;
                    const y = this.canvas.height - barHeight;
                    
                    // Create gradient
                    const gradient = this.ctx.createLinearGradient(0, y, 0, this.canvas.height);
                    const hue = (i / barCount) * 360;
                    gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
                    gradient.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(x + barSpacing/2, y, barWidth - barSpacing, barHeight);
                    
                    // Add glow effect
                    this.ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
                    this.ctx.shadowBlur = 10;
                    this.ctx.fillRect(x + barSpacing/2, y, barWidth - barSpacing, barHeight);
                    this.ctx.shadowBlur = 0;
                }
            }

            clearCanvas() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            updateAudioInfo() {
                if (!this.dataArray) return;
                
                // Calculate average input level
                const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
                const inputLevel = Math.round((average / 255) * 100);
                document.getElementById('inputLevel').textContent = inputLevel + '%';
                
                // Find dominant frequency
                let maxIndex = 0;
                let maxValue = 0;
                for (let i = 0; i < this.dataArray.length; i++) {
                    if (this.dataArray[i] > maxValue) {
                        maxValue = this.dataArray[i];
                        maxIndex = i;
                    }
                }
                
                const nyquist = this.audioContext.sampleRate / 2;
                const frequency = Math.round((maxIndex / this.dataArray.length) * nyquist);
                document.getElementById('frequency').textContent = frequency + ' Hz';
            }

            updateCameraInfo() {
                if (!this.videoStream) return;
                
                const track = this.videoStream.getVideoTracks()[0];
                const settings = track.getSettings();
                
                document.getElementById('resolution').textContent = 
                    `${settings.width}x${settings.height}`;
                document.getElementById('cameraDevice').textContent = 
                    track.label || 'Unknown Camera';
            }

            startFPSMonitoring() {
                let lastTime = performance.now();
                let frameCount = 0;
                
                const measureFPS = () => {
                    if (!this.videoStream) return;
                    
                    frameCount++;
                    const currentTime = performance.now();
                    
                    if (currentTime - lastTime >= 1000) {
                        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                        document.getElementById('fps').textContent = fps;
                        
                        if (fps >= 25) {
                            this.updateTestResult('frameRate', 'success', `${fps} FPS`);
                        } else if (fps >= 15) {
                            this.updateTestResult('frameRate', 'warning', `${fps} FPS`);
                        } else {
                            this.updateTestResult('frameRate', 'error', `${fps} FPS`);
                        }
                        
                        frameCount = 0;
                        lastTime = currentTime;
                    }
                    
                    requestAnimationFrame(measureFPS);
                };
                
                measureFPS();
            }

            updateTestResult(testId, status, text) {
                const icon = document.getElementById(testId + 'Status');
                const textElement = document.getElementById(testId + 'Text');
                
                if (icon) {
                    icon.className = `status-icon ${status}`;
                }
                if (textElement) {
                    textElement.textContent = text;
                }
            }

            updateStatus(message) {
                this.statusMessage.textContent = message;
                console.log('AV Test Studio:', message);
            }
        }

        // Initialize the application when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new AVTestStudio();
        });
