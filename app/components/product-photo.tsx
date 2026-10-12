"use client";

import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";

const photoByProduct: Array<[string, string]> = [
  ["beras", "photo-1586201375761-83865001e31c"],
  ["minyak", "photo-1474979266404-7eaacbcd87c5"],
  ["gula", "photo-1581441363689-1f3c3c414635"],
  ["tepung", "photo-1581441363689-1f3c3c414635"],
  ["telur", "photo-1506976785307-8732e854ad03"],
  ["mi instan", "photo-1569718212165-3a8278d5f624"],
  ["mie goreng", "photo-1569718212165-3a8278d5f624"],
  ["garam", "photo-1474979266404-7eaacbcd87c5"],
  ["kecap", "photo-1474979266404-7eaacbcd87c5"],
];

const fallbackPhoto = "photo-1586201375761-83865001e31c";

function getPhoto(name: string, category: string) {
  const normalized = name.toLocaleLowerCase("id");
  const productPhoto = photoByProduct.find(([keyword]) => normalized.includes(keyword))?.[1];
  const categoryPhoto =
    category === "Beras & Karbohidrat"
      ? photoByProduct[0][1]
      : category === "Minyak & Bumbu"
        ? photoByProduct[1][1]
        : category === "Gula & Tepung"
          ? photoByProduct[2][1]
          : category === "Protein"
            ? photoByProduct[4][1]
            : category === "Makanan Instan"
              ? photoByProduct[5][1]
              : fallbackPhoto;
  const id = productPhoto ?? categoryPhoto;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=480&q=78`;
}

export default function ProductPhoto({
  name,
  category,
  className = "",
}: {
  name: string;
  category: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`catalog-photo ${className}`} role="img" aria-label={`Foto ${name}`}>
      {failed ? (
        <Package className="catalog-photo-fallback" size={19} aria-hidden="true" />
      ) : (
        <Image
          src={getPhoto(name, category)}
          alt={`Foto ${name}`}
          fill
          sizes="(max-width: 650px) 44vw, (max-width: 1000px) 25vw, 18vw"
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
