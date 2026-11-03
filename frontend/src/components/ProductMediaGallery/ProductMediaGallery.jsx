import { useEffect, useRef, useState } from "react";
import "./ProductMediaGallery.css";

const mediaItem = (src, type = "image") => ({ type, src });

export const buildProductGallery = (item, url) => {
  if (!item) return [];

  if (item._source === "marketplace") {
    if (Array.isArray(item.media) && item.media.length) {
      return item.media
        .filter((media) => media?.url)
        .map((media) => mediaItem(media.url, media.type === "video" ? "video" : "image"));
    }

    return (item.images || []).filter(Boolean).map((src) => mediaItem(src));
  }

  const gallery = [];

  if (item.image) {
    gallery.push(
      mediaItem(item.image.startsWith("http") ? item.image : `${url}/images/${item.image}`),
    );
  }

  for (const file of item.media || []) {
    if (file && typeof file === "object" && file.url) {
      gallery.push(mediaItem(file.url, file.type === "video" ? "video" : "image"));
      continue;
    }

    if (!file) continue;

    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(file);
    const src = file.startsWith("http") ? file : `${url}/images/${file}`;
    gallery.push(mediaItem(isVideo ? `${src}#t=0.001` : src, isVideo ? "video" : "image"));
  }

  return gallery;
};

const mediaLabel = (media) => (media.type === "video" ? "video" : "image");

const ProductMediaGallery = ({ item, url }) => {
  const gallery = buildProductGallery(item, url);
  const media = gallery.length ? gallery : [{ type: "placeholder", src: "" }];
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [failedMedia, setFailedMedia] = useState({});
  const inlineVideoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const closeButtonRef = useRef(null);
  const touchStartX = useRef(null);
  const modalTouchStartX = useRef(null);

  const safeIndex = Math.min(selected, media.length - 1);
  const activeMedia = media[safeIndex];
  const activeFailed = failedMedia[safeIndex] || activeMedia.type === "placeholder";

  const pauseVideos = () => {
    for (const video of [inlineVideoRef.current, modalVideoRef.current]) {
      if (!video) continue;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Some streams do not expose a seekable timeline.
      }
    }
  };

  const moveGallery = (direction) => {
    pauseVideos();
    setSelected((value) => (value + direction + media.length) % media.length);
  };

  const closeGallery = () => {
    pauseVideos();
    setOpen(false);
  };

  const failMedia = (index) => {
    setFailedMedia((current) => ({ ...current, [index]: true }));
  };

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeGallery();
      if (media.length < 2) return;
      if (event.key === "ArrowRight") moveGallery(1);
      if (event.key === "ArrowLeft") moveGallery(-1);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      pauseVideos();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, media.length]);

  useEffect(() => {
    pauseVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex]);

  return (
    <div className="product-gallery">
      <div
        className="main-media"
        role="button"
        tabIndex={0}
        aria-label="Open product media gallery"
        onClick={() => {
          pauseVideos();
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            pauseVideos();
            setOpen(true);
          }
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const endX = event.changedTouches[0]?.clientX;
          if (touchStartX.current == null || typeof endX !== "number" || media.length < 2) return;
          const delta = endX - touchStartX.current;
          if (Math.abs(delta) > 45) moveGallery(delta < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        {activeFailed ? (
          <div
            className="product-media-placeholder"
            role="img"
            aria-label={`Product media unavailable for ${item.name}`}
          >
            Product media unavailable
          </div>
        ) : activeMedia.type === "video" ? (
          <div className="main-video-wrapper">
            <video
              ref={inlineVideoRef}
              key={activeMedia.src}
              src={activeMedia.src}
              controls
              playsInline
              preload="metadata"
              onError={() => failMedia(safeIndex)}
            />
          </div>
        ) : (
          <img
            src={activeMedia.src}
            alt={item.name}
            onError={() => failMedia(safeIndex)}
          />
        )}
      </div>

      {media.length > 0 && (
        <p className="gallery-open-hint">Tap the photo or video to view full screen</p>
      )}

      {media.length > 1 && (
        <div className="gallery-navigation">
          <button type="button" onClick={() => moveGallery(-1)} aria-label="Previous media">
            ‹
          </button>
          <span aria-live="polite">{safeIndex + 1} / {media.length}</span>
          <button type="button" onClick={() => moveGallery(1)} aria-label="Next media">
            ›
          </button>
        </div>
      )}

      {media.length > 1 && (
        <div className="thumbnail-row">
          {media.map((entry, index) => (
            <button
              key={`${entry.src}-${index}`}
              type="button"
              className={`thumb ${safeIndex === index ? "active" : ""}`}
              onClick={() => {
                pauseVideos();
                setSelected(index);
              }}
              aria-label={`Show ${mediaLabel(entry)} ${index + 1}`}
              aria-pressed={safeIndex === index}
            >
              {entry.type === "video" ? (
                failedMedia[index] ? (
                  <span className="video-thumbnail-fallback">Video unavailable</span>
                ) : (
                  <div className="video-thumb-container">
                    <video
                      src={entry.src}
                      muted
                      playsInline
                      preload="metadata"
                      className="video-thumbnail"
                      onLoadedMetadata={(event) => {
                        const preview = event.currentTarget;
                        if (Number.isFinite(preview.duration) && preview.duration > 0) {
                          try {
                            preview.currentTime = Math.min(0.001, preview.duration / 2);
                          } catch {
                            // Keep the browser's initial frame.
                          }
                        }
                      }}
                      onError={() => failMedia(index)}
                    />
                    <div className="play-icon">▶</div>
                  </div>
                )
              ) : (
                <img
                  src={entry.src}
                  alt=""
                  onError={() => failMedia(index)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.name} media gallery`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeGallery();
          }}
          onTouchStart={(event) => {
            modalTouchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const endX = event.changedTouches[0]?.clientX;
            if (
              modalTouchStartX.current == null ||
              typeof endX !== "number" ||
              media.length < 2
            ) {
              return;
            }
            const delta = endX - modalTouchStartX.current;
            if (Math.abs(delta) > 40) moveGallery(delta < 0 ? 1 : -1);
            modalTouchStartX.current = null;
          }}
        >
          <button
            ref={closeButtonRef}
            className="media-lightbox-close"
            type="button"
            onClick={closeGallery}
            aria-label="Close gallery"
          >
            ×
          </button>

          {media.length > 1 && (
            <button
              className="media-lightbox-arrow previous"
              type="button"
              onClick={() => moveGallery(-1)}
              aria-label="Previous media"
            >
              ‹
            </button>
          )}

          <div className="media-lightbox-stage">
            {activeFailed ? (
              <div className="product-media-placeholder">Product media unavailable</div>
            ) : activeMedia.type === "video" ? (
              <video
                ref={modalVideoRef}
                key={activeMedia.src}
                src={activeMedia.src}
                controls
                playsInline
                preload="metadata"
                onError={() => failMedia(safeIndex)}
              />
            ) : (
              <img
                src={activeMedia.src}
                alt={`${item.name} ${safeIndex + 1}`}
                onError={() => failMedia(safeIndex)}
              />
            )}
          </div>

          {media.length > 1 && (
            <button
              className="media-lightbox-arrow next"
              type="button"
              onClick={() => moveGallery(1)}
              aria-label="Next media"
            >
              ›
            </button>
          )}

          <div className="media-lightbox-count" aria-live="polite">
            {safeIndex + 1} / {media.length}
          </div>

          {media.length > 1 && (
            <div className="media-lightbox-thumbnails">
              {media.map((entry, index) => (
                <button
                  key={`${entry.src}-${index}`}
                  type="button"
                  className={index === safeIndex ? "active" : ""}
                  onClick={() => {
                    pauseVideos();
                    setSelected(index);
                  }}
                  aria-label={`Show media ${index + 1}`}
                >
                  {entry.type === "video" ? (
                    <span>▶ Video</span>
                  ) : (
                    <img src={entry.src} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductMediaGallery;
