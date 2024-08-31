// Import Firebase SDKs as ES modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCl4bd1A-6-HRYIcbgGfT02mQI73UWSa0s",
    authDomain: "digitalpassport-e49cb.firebaseapp.com",
    projectId: "digitalpassport-e49cb",
    storageBucket: "digitalpassport-e49cb.appspot.com",
    messagingSenderId: "1075577493433",
    appId: "1:1075577493433:web:1ea586b546d503dac98868"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const gallery = document.getElementById('gallery');

let currentImageIndex = -1;
let images = [];

// Function to display images in the gallery
function addImageToGallery(src, filename) {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'img-container';

    const img = document.createElement('img');
    img.src = src;
    img.alt = filename;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = function() {
        deleteImage(filename);
    };

    // Add click event to image for enlargement
    img.onclick = function() {
        currentImageIndex = images.findIndex(image => image.url === src);
        openModal(src, filename);
    };

    imgContainer.appendChild(img);
    imgContainer.appendChild(deleteBtn);

    gallery.insertBefore(imgContainer, gallery.firstChild);
    
    // Store images array for navigation
    images.push({ url: src, filename });

    // Update image count
    updateImageCount();
}

function openModal(src, filename) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('enlargedImg');
    const captionText = document.getElementById('caption');
    modal.style.display = "block";
    modalImg.src = src;
    captionText.innerHTML = filename;

    const span = document.getElementsByClassName('close')[0];
    span.onclick = function() {
        modal.style.display = "none";
    }

    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }

    // Add event listeners for navigation
    const prev = document.getElementsByClassName('prev')[0];
    const next = document.getElementsByClassName('next')[0];
    prev.onclick = function() {
        navigate(-1);
    }
    next.onclick = function() {
        navigate(1);
    }
}

function navigate(direction) {
    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    } else if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    }

    const image = images[currentImageIndex];
    openModal(image.url, image.filename);
}

function fetchImagesFromStorage() {
    const storageRef = ref(storage, 'atmg24');
    listAll(storageRef)
        .then((result) => {
            const imagePromises = result.items.map((imageRef) => {
                return getDownloadURL(imageRef).then((url) => {
                    const filename = imageRef.name;
                    const timestamp = parseInt(filename.split('_')[0], 10); // Extract timestamp from filename
                    return { url, filename, timestamp };
                });
            });

            Promise.all(imagePromises)
                .then((images) => {
                    images.sort((a, b) => b.timestamp - a.timestamp); // Sort images by timestamp (newest to oldest)
                    gallery.innerHTML = ''; // Clear existing gallery
                    images.forEach((image) => {
                        addImageToGallery(image.url, image.filename);
                    });
                    // Update image count after fetching images
                    updateImageCount();
                })
                .catch((error) => {
                    console.error('Error getting download URLs:', error);
                });
        })
        .catch((error) => {
            console.error('Error listing images:', error);
        });
}

// Function to update image count
function updateImageCount() {
    const imageCountSpan = document.getElementById('imageCount');
    const imageCount = gallery.children.length;
    imageCountSpan.textContent = imageCount;
}

// Function to delete an image from Firebase Storage
function deleteImage(filename) {
    const confirmDelete = window.confirm('Are you sure you want to delete this image?');

    if (confirmDelete) {
        const storageRef = ref(storage, `atmg24/${filename}`);
        deleteObject(storageRef)
            .then(() => {
                console.log('File deleted successfully');
                // Refresh the gallery after deletion
                gallery.innerHTML = '';
                fetchImagesFromStorage();
                // Update image count after deleting images
                updateImageCount();
            })
            .catch((error) => {
                console.error('Error deleting file:', error);
            });
    } else {
        console.log('Deletion canceled');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Function to upload image to Firebase Storage
    document.getElementById('uploadBtn').addEventListener('click', function() {
        const files = document.getElementById('fileInput').files;
        const uploadTasks = [];

        for (const file of files) {
            const timestamp = Date.now();
            const storageRef = ref(storage, `atmg24/${timestamp}_${file.name}`);
            const uploadTask = uploadBytes(storageRef, file);

            uploadTasks.push(uploadTask);
        }

        Promise.all(uploadTasks)
            .then(() => {
                console.log('Files uploaded successfully!');
                fetchImagesFromStorage(); // Call function to fetch images after upload
            })
            .catch(error => {
                console.error('Error uploading files:', error);
            });
    });

    fetchImagesFromStorage();
});
