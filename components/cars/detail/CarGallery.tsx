'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import styles from './CarGallery.module.css';

type Props = {
    images: { url: string; is_primary: boolean }[];
};

export default function CarGallery({ images }: Props) {
    const [index, setIndex] = useState(0);

    if (!images || images.length === 0) return (
        <div className={styles.placeholder}>No images available</div>
    );

    const next = () => setIndex((index + 1) % images.length);
    const prev = () => setIndex((index - 1 + images.length) % images.length);

    return (
        <div className={styles.wrapper}>
            <div className={styles.mainImageWrapper}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={styles.mainImage}
                    >
                        <Image
                            src={images[index].url}
                            alt="Car image"
                            fill
                            className={styles.image}
                            priority
                        />
                    </motion.div>
                </AnimatePresence>

                <button onClick={prev} className={`${styles.navBtn} ${styles.prev}`}>
                    <ChevronLeft size={24} />
                </button>
                <button onClick={next} className={`${styles.navBtn} ${styles.next}`}>
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className={styles.thumbnails}>
                {images.map((img, i) => (
                    <button
                        key={img.url}
                        className={`${styles.thumb} ${i === index ? styles.activeThumb : ''}`}
                        onClick={() => setIndex(i)}
                    >
                        <Image src={img.url} alt="Thumbnail" fill className={styles.image} />
                    </button>
                ))}
            </div>
        </div>
    );
}
