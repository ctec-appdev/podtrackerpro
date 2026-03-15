"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import MuiSelect from "@mui/material/Select";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import MuiTable from "@mui/material/Table";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useSession } from "next-auth/react";
import apiClient from "@/libs/api";
import StandaloneNicheSelect, {
  DEFAULT_NICHE_OPTIONS,
  normalizeNicheOptionLabel,
} from "@/components/NicheSelect";

// ─── CONSTANTS ─────────────────────────────────
const PLATFORMS = ["Amazon Merch", "Redbubble", "Etsy", "TeeSpring/Spring", "TeePublic", "Other"];
const COMPETITION = ["Low", "Medium", "High", "Very High"];
const LISTING_STATUS = ["Active", "Paused", "Removed", "Flagged"];

const PLATFORM_LIMITS = {
  "Amazon Merch": { title: 60, bullet: 256, desc: 2000, tags: 0 },
  Redbubble: { title: 100, bullet: 0, desc: 5000, tags: 15 },
  Etsy: { title: 140, bullet: 0, desc: 5000, tags: 13 },
  "TeeSpring/Spring": { title: 100, bullet: 0, desc: 2000, tags: 10 },
};

const STORAGE = {
  niches: "pod-dash-niches",
  keywords: "pod-dash-keywords",
  trends: "pod-dash-trends",
  briefs: "pod-dash-briefs",
  seo: "pod-dash-seo",
  ideas: "pod-dash-ideas",
  customNiches: "pod-dash-custom-niches",
  nicheProfiles: "pod-dash-niche-profiles",
  inventory: "pod-dash-inventory",
  performance: "pod-dash-perf",
};

const EMPTY_TRACKER_DATA = {
  niches: [],
  keywords: [],
  trends: [],
  briefs: [],
  seo: [],
  ideas: [],
  customNiches: [],
  nicheProfiles: [],
  inventory: [],
  performance: [],
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  {
    id: "research-group",
    label: "Research",
    icon: "◫",
    children: [
      { id: "niches", label: "Niches", icon: "◎" },
      { id: "keywords", label: "Keywords", icon: "⌕" },
      { id: "trends", label: "Trends", icon: "↗" },
      { id: "trademark", label: "TM Check", icon: "™" },
      { id: "research", label: "AI Research", icon: "✦" },
    ],
  },
  {
    id: "design-group",
    label: "Design",
    icon: "✎",
    children: [
      { id: "briefs", label: "Design Briefs", icon: "✎" },
      { id: "seo", label: "SEO Copy", icon: "¶" },
      { id: "ideas", label: "New Ideas", icon: "✸" },
    ],
  },
  { id: "inventory", label: "Listings", icon: "▤" },
  { id: "guide", label: "Guide", icon: "?" },
];

const BOTTOM_TABS = [
  { id: "improve-ptp", label: "Improve PTP", icon: "+" },
];

const CANNY_BOARD_URL = "https://podtrackerpro.canny.io/feature-requests";

const IDEA_COLUMNS = [
  {
    id: "backlog",
    label: "Backlog",
    stripe: "#64748b",
    help: "Capture rough concepts fast. Add a title first, then flesh out the details when you are ready.",
  },
  {
    id: "researching",
    label: "Researching",
    stripe: "#3b82f6",
    help: "Use this stage to connect the idea to niches, trends, and keywords that look promising.",
  },
  {
    id: "designing",
    label: "Designing",
    stripe: "#f59e0b",
    help: "Move cards here once you are sketching, prompting, or building the actual artwork.",
  },
  {
    id: "reviewing",
    label: "Reviewing",
    stripe: "#8b5cf6",
    help: "Use this lane for quality control, trademark review, copy polish, and final checks.",
  },
  {
    id: "posted",
    label: "Posted",
    stripe: "#10b981",
    help: "Drop finished ideas here once the design is live so you have a lightweight win log.",
  },
];

const EXAMPLE_ROWS = {
  niches: {
    niche: "Fishing",
    subNiche: "Bass Fishing",
    score: "8.8/10",
    demand: 9,
    competition: 6,
    evergreen: 9,
    brandability: 8,
    status: "Validated",
    notes: "Strong evergreen hobby niche with gift-buying potential.",
    date: "2026-03-14",
  },
  keywords: {
    keyword: "bass fishing shirt",
    niche: "Fishing",
    volume: "High",
    competition: "Medium",
    platforms: "Amazon Merch, Etsy",
    status: "Active",
    notes: "Good mix of evergreen intent and product fit.",
    date: "2026-03-14",
  },
  trends: {
    trend: "Retro lake-life graphics",
    source: "Pinterest",
    category: "Outdoors",
    seasonality: "Spring/Summer",
    peakMonths: "Apr-Aug",
    score: 8,
    notes: "Pairs well with boating, camping, and fishing designs.",
    date: "2026-03-14",
  },
  briefs: {
    id: "DB-001",
    niche: "Fishing",
    slogan: "Weekend Forecast: 100% Chance of Fishing",
    style: "Vintage distressed badge",
    platform: "Amazon Merch",
    status: "Ready",
    date: "2026-03-14",
  },
  seo: {
    designId: "DB-001",
    platform: "Amazon Merch",
    title: "Bass Fishing Shirt Vintage Weekend Forecast Tee",
    bullet1: "Great gift for anglers, dads, and lake weekend trips.",
    description: "Vintage-style fishing shirt copy optimized for hobby and gift buyers.",
    date: "2026-03-14",
  },
  inventory: {
    sku: "POD-001",
    design: "Bass Legend",
    briefId: "DB-001",
    imageUrl: "https://placehold.co/112x112/png?text=POD",
    platform: "Amazon Merch",
    status: "Active",
    sales: 3,
    url: "https://example.com/listing",
    dateListed: "2026-03-14",
    notes: "First live listing with a sample image preview.",
  },
};

// Kept only as a historical fallback while the app uses the shared public logo asset.
// eslint-disable-next-line no-unused-vars
const LOGO_SRC = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABtAlcDASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBQYDBAkCAf/EAF4QAAECBQEDBQQSDgYKAQUAAAECAwAEBQYRBxIhMQgTQVFhFCIycQkVFxg3QlJVVnR1gZGTlKGysxYjNjhGYnJzhLG00dLTM1eSosPUJDRDRFOCtcHCxFRklaOkpf/EABsBAQACAwEBAAAAAAAAAAAAAAAEBQIDBgEH/8QAQxEAAgEDAQMHBwkHAwUAAAAAAAECAwQRBRIhMQYTFEFRcYEiYZGhsbLBFTI0NVJz0eHiByNCVIKT8BYzklNicsLx/9oADAMBAAIRAxEAPwCmUIRYDTS0aFp9aMrft4ySJ+rzydukU5YBCARkLUD6bBByc7II9Md26hQlWlsxKzVNUhp9NNxcpyeIxXGT+CXFvgkRXQdN77rkqmaplrVJ5he9Dq2+bSsdaSvAI7RGU8xjU72JzPx7X8cb1XNUr0qkypwVdci0T3rMoA2lI8fhH3yYxn2dXl7Jqr8pV++LVaXTxvbKfpWvT34pR83lvHju9hrHmManexOZ+Pa/jh5jGp3sTmfj2v442f7Ory9k1V+Uq/fD7Ory9k1V+Uq/fHvyXS7WOf17tpeif4mseYxqd7E5n49r+OHmManexOZ+Pa/jjZ/s6vL2TVX5Sr98Ps6vL2TVX5Sr98Pkul2sc/r3bS9E/wATWPMY1O9icz8e1/HDzGNTvYnM/Htfxxs/2dXl7Jqr8pV++H2dXl7Jqr8pV++HyXS7WOf17tpeif4mseYxqd7E5n49r+OPlejWpqUlRtOawOp1on5lRtP2dXl7Jqr8pV++PpN+XklQULmqmR1zCj+uHyXS7WOka920vRP8SKbht+uW9NCWrlJnac6c7ImGSja7Uk7lDtEYyLJW/qWmrS5t/UOTl6zR5nvFvLaAcZzuCt2M46xhQ4gnhEVa16fLsO4m0yrxmqLUEl6nTJIJUjdlBI3FScjeOIIPTgQbqydFbSeUS9P1irK4VpewUKjWYtPMZY44bw011p78bzQoQhEE6AQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAQhCAEIQgBCEIAzNi05qr3tQqU+MszlRl2HB+KtxKT8xMTbygag7NajTMmpR5mQZaZaQOCQUBZwPGr5hEQaTeijavuxK/WpiT9dFY1VrQ/GZ+pbi50zdGTOVvVt65ST/hpSa73KKfqNOzDMdmhUmrV6ot06i02bqM454LMs0pxZ7cDo7eAiwWm3JVuGp83OXvUkUSWOCZSWKXZlQ6irwEf3vFE+pcQpLymXEacpcCuzLbjzqGWW1OOLUEoQgZKieAA6TGauSz7qtuUlpuv29U6ZLzQ+0uTUsptKzjOMkblY34O/si7CGNFNCZELWadIT+xuUs90VB7d0DesA9gSnxR2pOrWZyhdLKtIyfPNNKWpkpmEJD8o8ne07sgnsIwd42k54xDeoPKko+T2m5UOrO8oDmGY2PUCw7rsWqvSFxUiYl0oWQ3MhBUw8M4CkL4EHq4jO8A7o69kWZdF6VNEhbVGmp9wqwpaEYaa7VrPepHjMTudjs7Wdxo2XnB+Wzadz3OiZXbtAqVVTKpBfMpLqc2M8AcDid+BxOD1RipuXmJSZclpph2XfbOytt1BSpJ6iDvEXwsmj2/ye9GZiarc426+kmYnXG9xmplQwlpoHBO4BI8SlHG/HTpt2aI65SjUhU2ZJypKGyiVqCRLziD1NuA5V4kKPaIg9PeW1HMe03cwsYzvKLZhmLAcoXQm17BpTldpl7SsiyQS3TaqvLzp6migZWewp3dKumIppuluoNQsOo3yaS3TKDIyqpoPz6+bVMpHQ2jBUc9BICT0GJCvKTjtZMHSkng1XMb/eg8vOS8iZmiXHqJU0IZWeISSE7OerDoGPxR1RHDLu20leMbQBxEjTJzyU7h91W/psRlcNSoy7ig1tbMrafWqsPW8P1Mr5CJG0P0dubV6cqkrbU9SJRdNbbceNQdcQFBZUBs7Da8+CeOIlLzleqfr/ZnyyZ/y8cydeVnhFmPOV6p+v8AZnyyZ/y8Yqt8kDWCnsKdlWqDVlDg3J1DZUfFzqUD54Ar5CMrdVuV61aw5SLjpE7Sp9vepiaaKFEdChnik9BGQeiMVACEZK2qDWblrLFGoFMmqnUJg4al5dsrWrrOBwA6Sdw6YsTavIx1FqMqiYrtaodEKxksbaph1HYrYGx8CjAFZIRait8ie92G1rpF20CeKRkIfQ6wVdgwFjPjMQDqJp3emn1REjd1vzdMUskNOrSFMvY47DicpV0bgcjO/EAarCETpplyXb/1Asam3fRqxbEvIVBLhZbm5l9LqdhxTZ2gllQG9B4E7sQBBcIsx5yvVP1/sz5ZM/5eMfVuR1q7JNKXLOW5UlDgiWn1JJ+MbQPngCu8I2O+bFu+x58SV2W9P0l1ROwX2/tbn5CxlK/+UmMZbclLVK4qZTpyZErLTU20y8+SAGkKWEqVk7twJO/qgDHwiyvmDaXf1ryvymW/ih5g2l39a8r8plv4oArVCLSz/JqsmnyTU9P3+9KSrpAbfe5lDayQSAFE4OQCfEIx/mDaXf1ryvymW/igCtUInm/dHNPaDZ1TrFL1Hl6jOyjBcZlUvsEuqyN2Eqz8EQNACEIQAhCEAIQhACEIQAhCEAIRZimUSjK5FblXVSJA1HmXT3WZZHPbp5SfDxtcN3HhFZ4AQhCAEIQgBCEIAQhCAEIRtVgWJV717t8qpmRZ7j5vnO6VrTnb2sY2Uq9SerojOEJVJbMVlke6uqNpSdatLZiuLfo9pqsIlTzCru9caH8e7/Lh5hV3euND+Pd/lxv6FcfYZU/6o0j/AK8SK4RJFQ0WvaVbK2W5CdI9KxMYP98JjQapTp+lzq5OpSb8pMI8Jt1BSrx7+jtjVUoVKfz4tE+z1Szvcq3qqT8z3+jidWEZG26RM16uSlHk1stvzS9hCnSQgHBO8gE9HVEh+YVd3rjQ/j3f5ce07erVWYRyYXusWVjNQuKii3v39hFcIlTzCru9caH8e7/LjrTmid6MNlTSqZNEelamCCf7aUiNjsq6/gZFjym0mTwriPpI0hGTuCgVmgTQlqzTZiScOdnnE96vHqVDcr3iYxkRnFxeGXNOrCrFTptNPrW9CEIkC1tI7urkuiacZZpkusZSqcUUrUOsIAJ+HEZ06U6rxBZI95f21lDbuJqK8/w7SP4RMbugtWDWWq/JKc9SplSR8O/9UaZd+m112y2uYm5ETUogZVMyhLiEjrVuCkjtIAjbUs69NZlEgWvKLS7ufN0qybfVw9GcGnwhCIxdCEIQBs+k3oo2r7sSv1qYkrXdWNV62PxmfqW4jXSb0UbV92JX61MSLr0rGrVcH4zP1LcW2nvFOXecvc/X0Pupe/Eu/RKnaWn2hjN50O22mKd5VsTzkvINpS47tpTvUpRyoja3lRJAB48Iq7qRym7+uYuStEcRbFPVkBMmramCO14gEHtQExPWgx+znklCiKPOPqp05S1DqUNsN/AlTZih5UQcHcYxtqcHKW0stMv6kmksHamZp+ZmHJiZeceecUVLccUVKUTxJJ3kxsumd/3Dp7cjdct6aCHPBfYcyWZhHqFpyMjt3EcQRGobUNqJ7aksM0rK3l2LY5WlkT1OQi5aJVqbNkbLyWW0TDB8SshW/qKd3WY4rk5W9mSUqpu27dq1QfAIR3QESzI6t4Kle9siKWbUNqInRKOc4NnOzN31V1OujUarJqFxzqQyzkS0myChiXB47Kc7yelRJJ68ACPnTDTW99SZ8M2tSl9xpXsvVKZy3LM9eV474j1KQT2R+6aWfS7tk6omfcmGnWC0GXGl42c7ecg7jwETFpXqXqdY140TTSTTIXpJzAS3KSpT3O/LNdriQQlIAKiVBe4HhG6sqlOlmmtxV0dWtKt7KybfOR6scdye5+JNOlOgNt2q+zWrnmnrwuVCUgT1Sy4hgJHepabUSAE9BOSMbtnhH5yzqp5W8nuvNpVsuTrkvKoPjeSpQ/spVExxWfyQep8zp5blHCsGcq/PkdaWmlA+9l0fNFRBudRZLt7kU5bOyhKeoARJLpzyUrh91m/psRGO1Elk55KFxe6zf02Iuqr/AHcl5mctrq3W33tP3jfvI1PuhvX2pKfTciy2v+p7GktkM3PMUd2rIcnm5PmG3w0QVJWrayUn1HDHTFafI1PuhvX2pKfTciSvJDvQJk/d6X+qejnjrTUPPw0r+rud/wDuif5cb5phystObwrEvRqkxP23OzCghlU5srl1rJwE84k96e1SUjtjzshAHq7rNpjbWqVpPUOvSyEvhJMlPIQC9KOdCknq3DKeCh7xHmPPWPcUrqO5p+ZIuV1NR8r0spO5bpVsgg+pO454YOY9NOT1U6hWNELOqVVcddnHqUzzrjpytzCcBZPSSADnpzEV0Ky5Oo8u+47lKEFFIo0vMkAf7y6yllJI/NhZ8eIAkbQDSG39JrSakJJlmYrUw2k1OpbPfvr4lKSd4bB8FPvneSYjvWHlbWbZlYfodu0x66ahLOFuYW2+GJVtQOCkObKisg9ScfjRt3LCveasXQyqzlOfVL1GpOIpkq6k4KFOglah1ENpcwRwOD0R5lQBeKx+Wvb8/VESl3WjNUWWWQO7JSa7qSjtU3sJUAOtO0eyLG3DRbQ1OsYSVSYlK3Qamyl5laVZSoEZS42ob0qGdyhvEeSEXd8jlvWanaFX7EnX1ON01SJ6QB37DbhIdSOoBeyoDrWqAKu67adT+l+pFQteb5x2WSeep8yof6xLKJ2FeMYKVfjJMX65GX3tFofm5n9reiNfJGrVbnrBoV3tJAmKXPGUdON6mnk539eFtpx+WYkrkZfe0Wh+bmv2t6AMHr7yk5HSa+W7XmLTmKstck3N8+3OpaAC1LTs4KDw2OOemNTt7lr2XNTaGq3adapjSjgvMOtzAR2kd6ceLJ7DEP8Akhfo8y3uHL/WPRXKAPWkixdWrBIzT7ltypI4+EkkfApC0nxKSeox58cqbRl7SO8GUSDkxN27U0qcp8w6AVIUD3zKyNxUnIIOBkEdIMbPyDr/AJy2tXGrTemFmkXElTKmie9RMpSVNuDqJwUHHHaGeAxbblYWWm99DK/IttBc9INeWUmcbw4yCogdqkbaf+aAPMCEIQBavlRfe6WZ7Zkv2N2KqRazlQ/e4Wb7akf2N2KpwAhCLqalaS0G6pa1gmUkKHSZNDk1VpuWZbZUWg2khO1jiTnedwAJ7CBSuEWfc1z0ysZw0qwrGROSzHe91JKZfnTwztKSpxXjVgmNHte1ndedXqtWZaUNCouWnZ3YUFlobAQEIOACtRQo5IwN5OeBAhiEWjuPUvSzSmbVbtk2ZJ1iflFc3MzaikALHEF4pUtageIGEjfg9EY+R5TNNqcw3K3ZYElMU9atlxTbiXShHY2tGFeLIgCtkIsVrrpXbE7Y7ep2m4QimrbD0zKtA82WycFxCTvQUncpHAYO4YOa6wAhFhNMNLbUtixU6k6r5MotKVyVMOQVbXgFSQQVqVxCOAG9XTjtu8puTp7/AHPbunlPlacjvUoU8G1KQPxUIwnxb4ArhCLXW7X9I9ciuhVa2mrfuR5Kiw40EhxZAzlDyUjbIAJ2Vp68A78V51Qsqp2Dd8zb9TIc2AHJd9Iwl9o52VgdHAgjoII38YAn+lfeKu/mXv29UVYi1NL+8UX+Ye/6gqKrQAhE0cn7Rxd3K+ym6cyNqyuXCXFc2ZvZ3qAV6VsYO0vsIHSU9HX7UC3LgnvKCyaFSqfRJReDNsSTbbs2ocCCEgpbHQOJ4noAAiWESxoDpOL8mJmt12ZVIWxTTmZezsl5QG0UJUdyQBvUroBHXkbvPa22BY82ql6b2DITEvLnZFRePNqdI6QSkuKH4ylA9kAVwhFn6DrBp1qZOIt7USzZGnqmftbM/thaUrPD7ZspW14wSOvAiK9fdLZjTW4mky7zk3RZ4KVJPrHfJI8JteN20Mjf0g56wAI0hFkORNRaPV/su8tqTIVDmu4ub7ql0O7GefzjaBxnA+AR2abRdNtEaJK1C9pFFdu+dbEw3T+bS4JZJO4AK71OOBWckkHZ3AwBWaJw5K34Sfov+NHxq/rlT77st625ezk0z7c2tmY7qSspCTkjZDYxnsMffJW/CT9F/wAaJ2nfSY+PsZy/LP6lrf0+/EkjUq8G7LorFTdkFzoemQxsJc2MZSpWc4PqfniPvN8lPYy/8rH8MZPlO/cPT/dJH1TkV1ibf3talWcYPccxyU5NabqGnKvcU8yy1xa4dzLOWhq9bNfn2qe8iYpk06QlsPgFtajuCQoHj4wI2G/7Qpl30ZclOtpRMJSTLTIT37Kv+6T0jp8eDFQwSDkHBEXFsSamJ2yqJNzalrmHpBlbi1cVkoGVHx8ffjdY3LulKnVWSt5UaHT0GpSu7GTjl9vBrs83amVu0ykpmm6u0unzjfNzEtOqacT1KSFAxaKqzYkKXNzxQXBLsLdKQcbWyknGfeiDas02zynmQ0AAqYaWoDoJYGf3+/E0Xb9ytX9ovfVmMrCPNwqRXU2auVtfptzaVZL59OLfi2RT5vkp7GX/AJWP4YytA1vtyfnG5eoyU1TAs455RDjaT2kbwO3EVzhFZHU7hPLefA7iryH0ecXGMHF9qk/i2i59fo9MuGkOU+pMNzMq8nd1jqUk9B6iIqRedCftq5p6izCttUs5hK/VoIBSr30kRZzR59+Y00obkztbYlygZOTspUpKf7oERLrdTk1fWSn0phWy5NtS7K1D0pUsjPvJwYnajBVaMaiW949ZynI26qWGo17KcswipZ7MxeM+K+BsGgmn0u1IM3XWZdLsw938i0sZDaOhwj1R4jqGDxO7e7/v6h2a0hM+px+cdTtNSrIBWRw2iTuSM9J7cA4jZAJen08BIDUtLNYAHBKEj/sBFOrqrMzcFwztYm1EuTLpUAfSJ4JSOwDA96M69RWFFQp8X/mTRpNnPlXqNS5u2+bj1d/CK7Fu3/nkl1nX0GZHPWxssE7yidyoDr3oAPzRKVnXTRbupapykvFxKTsvMuJwtokcFD/uMg798U8jddFa69Q9QKeA4RLzzglH09Cgs4SfeVsnPj64iWupVecUajymdBrvIqx6JOpZx2JxWeLaeOre34ec2PXqwpegzDdfosvzVPmF7Ew0gd6y4d4IHQlXVwBHaBETxci9qQmvWlU6QoZVMS6kt56Fjeg+8oAxTeNWp26pVMx4Mm8idXqX9k6dZ5lTeM9bT4Z9a8BCEIrjszZ9JvRRtX3YlfrUxIGvysauVz8pn6huI/0m9FG1fdiV+tTG9coFWNX67+Uz9Q3FnZvFJ95zFx9fQ+6l78SWuRzrLQ7HTP2ldcwZKmz0wJmVnCCW2XSkJUleN4SoJRhXAEHO45E/UvSnQK6pmZnaRSKBV3HFl99UlUlugFZJyQhzCQTnA3Dqjzr2otf5HYc1i8/a8p9J2MK8MJzi8HQQedzIN13pFNt7V65aLR5RMpT5ScLbDKVEhCdkHGSSemNJ2okDlNqxr3eHugfopjR7dZZm7gp0q+kqZemmm3Eg4ykrAI+CJVOWYo0VZKnGU3wW86+1FmbTkJEWnS0CTl9hUk0VDmxg5QM568xrOpdqW5J2PUJqUpErLvsISptxpGyoHaA49O7rjkptx1Cbk6HaNlU5dbuWZkmUpZaGUS/eJypw8BjickAcSR0z4YoN7b6j5rq93V5SW9FWUGntNb+5PLx1bzTbErsxR6jW6PQqa7UK1UJ1MvTZNlBVkgrGSB0DI3fqGSLh8n/SqV00oc5dF1zTExdU+0XqpPurGxKtgbRaSo7glIGVHgcdQEfmhOj9A0koczcVfm5SZuJ1pTtSqrxCWpZPFSGyrGygdKjgq6cDAFf+Uprq/qHU2bNtZx+WtJyaSy/NgFC6ioKGcZ4NjIISd53E9AFPUrTuHsR4I+g29hb2U53LXlyxl9ySwvRk7+qWs913FqCxfFm84LTtCbBl2ySgVHPevOEdRQSnf4KTncScY7lt3tR7xqVju0OeampPyrXPJCVAqb59SRsrA8FQ5rBB3iMnXJGUp1i1GQk2EMyzNOeQhtI3Ac2qKvp2UncIlVbSNFxwVHJ3Xp6uq03HCUt3djr852NqJQbOeSdcXuu39OXiKNqJVlznkmXF7rt/Tl4SeYS7mbNeW62++p+8SF5Gp90N6+1JT6bkTdyy7GunUHSaWodoUvyyqCKszMKZ7oaZw2lt0FW04pI4qTuznfEI+RqfdDevtSU+m5FqNXdRrf0vtZu47lROrknJpEqkSjQcXtqSpQ3FQ3YQemKQ6ooB513XX2Df/wBaS/nRuWnPI81CqlaYN5uSdv0pKgp/YmETEwtOd6EBBKQSN20Tu44PCJz8+PpJ/wDGub5C3/MjF1rlq6eS7CvKm27lnnxwDyGWGz/zBxR/uwBYyVZo1q2w1Ltlim0akyYQnbXsty7DSMDJPABI4nqiCeSVdTWoGouq99NBQYqE/JS8olacKTLstupbyOglOCR1xVTXLlDXzqk0umTC2qNb5UD5Wyajh3ByOdWd7hB6NydwOzkZiaPI0p8Bd8UtSxkiSmG09O7nkqPzogDYfJI31J07teWBOwurLWfGllQH0jFFYvt5I3TnZjSah1JtBUiUrSUOYHgpWy5v8WUge+IoTACLKeR1vqa1wqbQ8F6330keJ9g5+b54rXFn/I46e49q7Xals5alaGtonqW4+0U/MhUAWM5b0qiZ5NVyuK8KXclHUePuppP6lGO1yMvvaLQ/NzX7W9GK5ds8JTk5VeXKgDOzkowBnjh5LmP/AMfzRleRl97RaH5ua/a3oAqv5IX6PMt7hy/1j0Vyixnkhfo8y3uHL/WPRXOANz0KmFSutdjvoJym4JEHHSC+gEfATHq3UZVE7T5mSd/o5hpTSvEoEH9ceWXJupT1Z16smSYSVKTWZeZUMZ7xlXPL/utmPUS5ak1R7dqdXfVssyMo7MuK6koQVE/AIA8e1DCiD0HEfkIQBazlRfe5WaM/71I/sbsVTi1nKh+9xs321I/sbsVTgBFveV1X5ymaR0WkSilNoqrraJhQOMtoQFbPvq2fg7YqFFpuWf8AcHZ351X1SYAqzEj6WavVzTu36jSaNTae8Z50uqmHwvnEHYCRjBA3cRnpMRxEhaJ6XVXUqtuMsPdxUuU2TOTik7WznghA9Ms4PYBvPQCBHxJJJJJJ4kx+RZSs1jk+6bvqpEhbBu6pMHYfed2X29scQpS+8z2ISRGNVr3YzJ2JXRShc2OGXGUfMJcwBsvJcWqpaA3nSZolcuFzSEgnOErlhkDsyCfGTEFaJ283dOqtv0V9KVy7s0HH0qG5TbYLi0nxpQR78Wp0lvWl3vpndE9SrSk7abl0PNLYllpUHDzOdo7KEb9+OB4RX3klFA1ypG34RYmdjx8yv/tmANh5aNzPz9/ytsNuFMnSZZK1Ng7i84NokjsRsAdWT1xAsSbypQsa8XJt8cy2PF3M1iIygDt0aoTNJq8nVJJwtzMo+h9pQOMKSQR+qJh5TmodnahsUGct/uoT8oHUTHPMFHeKCSBnpwQfhMQnCALUUv7xVe//AGD3/UFRofJ90b+ylIu67j3Fa0rlwBxXN917Phbz4LQwdpXTggdJE06GUqjVrkuUmn3EtKKStMw5NlTnNp5tE44s7SuhPe7zu3Z3jjHFbmptgan1Cr6X9xGUpT0v3PTl5DaZpKRv2E47wpwFIHSE8BjEAQ3ygtYxc6fsQtD/AEG1pXDZLSeb7r2dw3DGy0MDCeniegCFUJUtaUIBKlHAA6TG06qWNVdP7umKFUgVtj7ZKTIThMw0TuWO3oI6CD44w9p819lVI7o/oe7mec/J2xn5oAshyjZg6daI2zp3SlBlc8jYnFtbucS2Eqd/tuLB7QCIq5F3OUHqfIaf1Gky8/ZkrcAnGXFocefS3zWyQCAC2vjkdURd55G3/wCqOl/LW/8ALwBXSLTVtxd98jVipTxD1QpCUqS4recsOlvOestHf1kxhPPI2/8A1R0v5a3/AJeOld/KKlK5Y9VteUsFmmNT8utkLaqIKWyr02wGRn4RAGw8hD8Mv0H/ANiK/ag1+cue9avXZ5Si7NzS1hJVnm0ZwlA7EpAA8UWB5CH4ZfoP/sRWef8A9emPzqv1wBwROHJW/CT9F/xog+Jw5K34Sfov+NE7TvpMfH2M5fln9S1v6ffibfrtblZua1ZOSokn3XMNzyXVo51CMJCFjOVEDiREMeZLqD7H/wD9xj+OLFXtddMtCmNVCqpmFMuvBlPMoCjtFJV0kbsJMah5t1m/8Kq/J0/xRaXdC1nUzUnh/wCeY4Tk/quuW1mqdlbqcMvfhvf18JI0O09E7gmqg2q4Fs0+SSQXEocDjixnekbO4ePO7qMT+tcjSKUVLU3KyUmzxJwlttI/UAIjCf12ttts9xUqqTDnQHAhtJ9/aJ+aIqv/AFGr93gy8wtMnTwciUYJ2T1FZ4qPzdkao3FraRfNb2yZV0jXeUNeDvlzcI+GO3Cy233mUtatG4teJSskKSmZnyWwriEBBSgHt2QIsbXpVydoc/JM7POzEs40jaOBlSSBn4Yqxo96JlD9sf8AiYtZVJtMhTJqeWgrTLsrdKRxISknHzRs0yW1Sm5dbI3LmkqF9b06K+bBJLubwV08xG8v+LSvlCv4Yy9u6E1Nc4hdfqso1KjepEoVLcV2ZUkBPj3xmvN6pHrBPfGoiSLKuOSuq3mKxIhSEOEpW2ogqbWDvSce8fERGFC1sqksQeWb9T13lNZ0du4goRe7KS/FnO+9SLWt3bdW1I0yQZCRk7kpG4AdJPR1kxX60qwu7tepKrPApQ9NKWyg+kQ22ooHjwkZ7cx3OUk1XWLmYVNzz71ImG9uUa4IaUBhacDcT05O/CsdEajpFMiV1KoTpONqaDf9sFP/AJRqurlyrxpYwotFhoOiQoaTXvtvbqVact/ZueV354+deLs7fbimrIrzqfCRTZhQ8YaVFOIubdcqudtarSTadpcxJPNJHWVIIH64plDWF5UT39nLXMV115XsYju0JwtVuQdTxRMtqHvKEdKMnaksqcuilSiBlT06y2PfWBFRDfJYPoVw0qUnLhhlzYpVWGUy9XnJdPgtTC0DxBREXUWpKElSiAlIySegRSadeMzOPTCuLriln3zmLrWOEPH4HzL9m6e3cPq8n/2OGEIRRn1M2fSb0UbV92JX61MbryhVY1hrw/GZ+objStJvRRtX3YlfrUxuHKIVjWSvj8Zj6huJ9u8UX3/A5qt9fw+5l78TRtqLZeRznNYvP2vKfSdipA2jvAifOSBqH5n07cak2rX7im6k0w3LS9Ll+dO0grJ2zxHhDGAY9q5lBpF9HczYKq22vlR6guKQlS23TsKI3pzsZxGv61OSkpVbVn5jYbDU+FOObOSEBSCeG8gRnJqz9RazqJX74qrtD00lK47zil1+oNJdab3bkoOFFW70yU+9Hbl3uTxZE8mertcq2q1xpICUJZKpUL6NlKiEEZ6CpwdQiXC6jCgqaWWclccnqtfWXfymlBLGOt+Th93Hz9xx0O3b01qCqXa9NVSrVcUEzVbn2yEuAHJDSeKzkcB75TE3SLuj3Jqtcybk4jy1fbCngkB2ozyhw70eCjjgHZQOvOSYc1N1u1aq9rTczQKTL2JQJZoBKUKzOKRkJCQrA2OI8FKSOsxiLCtGksyUncM2l2pVecZRMuzc4surC1pCiRnp38ePbHnMVrqf7x4Nc9V0rk7ZbNqtre1uecyws5fo/A5Li1AuTXutTknUn10S06a6g+VMus7b6iTs86v0xGz1YG7Az30aXq9KStOua0pKSYbl5dpQShtAwAOcTGR0JOaxd3txH0nY6euRxelrfl/4iYkxpwhbZiv8yVFW/uLjlHzU5eTGLwupZp5ft4kl3d9ydY9ov/VqiqO1Frrw+5Kse0H/AKtUVL2oag8SiZ/s8X7it3r2HNtRLMkc8kq4vdhv6cvEQbUS7TjnkkXF7sI+nLxBjLMZdzOl5QLybb76n7xI/kan3Q3r7UlPpuRJXkh3oEyfu9L/AFT0Rr5Gp90N6+1JT6bkSV5Id6BMn7vS/wBU9FUdOefMIQgBExcj2+5awtbqbNVKaTLUuptrp044o96gOYKFHqAcSjJ6BkxDsIA9Z9YrJldRNNa1aE0tLRn2MMPEf0TySFtr68BaU5xxGR0x5YXlbNctC45u3rip70hUZRZQ404OPUpJ4KSeIUNxHCLZcmDlTyUrS5Wz9T5osJlW0syNZKVKCkAYSh8AE5AwA50+mwcqNoKpQdPtSaRLzs/TLfumQUMy8yptqZSB+I4M494wB5MMNOvvtsMNrddcUEIQhJKlKJwAAOJJj0b5F+lE9prp5MTteY7nr1dWh+ZYUO+l2kg800r8bvlKI6CrHREjWxplpxaU15ZUKzaFTJloEiaRKo5xsdOFnekeIxFuv/KetGxqa/TbRnZK47lVlCEsL5yWlT6pxadyiPUJOcjeUwBFPkjN8y07VaFp/IzIcVTyqfqKEnIQ4tISyk9SggrPicTE88jL72i0Pzc1+1vR5s3BV6lX65O1urzS5uoTz6n5h5fFa1HJPZ4huHAR6TcjL72i0Pzcz+1PQBVfyQv0eZb3Dl/rHorqy2486hlltTji1BKEJGSoncAB0mPXG4bGsm458VC4bOt6sTgQGxMT1MZfcCASQnaWknAyd3aY45G3LDs9Jn5Gg21byUjBfZlGJUAflACAK7chzQ+q2o49qFd8i5JVKZYLFMknklLrDavDdWk70qUAAAd4G1niMbNy7NSJa1NLHbSlJhPlzcaeY5tJ75uVB+2rPUFeAM8dpWPBMdjWLlU6fWdJvylszbV11vBS23JrzKtq9Ut4d6R2I2ieG7OYoTqDeFevu7Jy5rknDNVCbVvIGENpG5KEJ9KkDcB75ySTAGAhCEAWs5UX3uVm+2pH9jdiqcWR5RF22xWdB7VpFJr1PnZ+WmJNT0uw+lTjYTKuJUSBwwogeMxW6AEWm5Z/3B2d+dV9UmKsxYzlX3XbVw2Za0rQ67T6i/LOKLzcu+lamxzaRvA4b4ArnFrtHETMnyRa9NUFRRUXG551am/DCgNkkY37QbSMe9FUYmTk26us6fzczRq8h12355znFKbTtKlncAFez0pIACgN+4EdRAhuEWkrGkOjF3zS6va9+SdLQ+ecVLNTTS0IJ3nCFkLR+STu6AOEdRNpaCaZq8ta3cZuuoM4WxJIdQ8FKHD7W33vxitmANl5Mtt1Wi6F16cqLBYFWS/MyzagQstczshRHRkgkdYwemK2aQXC3auplArz6yiXlptIfUPStLBQs/2VKizGk+uNHuxy5hd9Up1AlVLbRTpZ55KNllSVAjaONtWRkntHARUKdZTLTr8ul5t5LTikBxs5SsA42geo8YAnnlo2w/KXnI3fLtlchVJZDTjqd6Q8gYAJHWjZx17KuqIAiwej2sFuTln+Z3qnLiZpAbDMtOLQpYSgeChzZ74bO7ZWneMDhjMZOe0J0tqqxPW7qlKy0irvyh19iY2R0gKC0Y98EjpgCuNMkpmpVGWp8m0p6ZmXUtNISMlSlHAHwmJX5Rmmtq6beUklRqlUpuoziHHJlE062pKEJ2QlQCUJI2lFWMk+CYkClzeh+i5VUqbUlXfcyEkMKZdS7sEjBAUn7W2Ognvl7zjpEV/v+7Kve10zVw1l0KmHzhCE7kMtjwUJHUPn3k7yYAsTS8+cVc/MPf8AUFRV2SmZiSnGZyUfcYmGFpcadbVsqQoHIIPQQYsRTrstlHI5XbS67T01nmXR3CXxz2TOqWO94+Cc+KK4wBbWiTtH5RWlblIqa2JS8KSjaS7jGF4wHQB/s14AUBwPRuTFWq1TKlb1dmaXUpdyUqEk8UOtq4pUOntHAg8CMGO3Y90Vazrnk7goz3NzUsvOyfAdQfCQodKSN3zjeAYnPXSd081OsmUvWkVymU26GJcF6QmJhKHXkDwmiDjK0nOyr0w3dIwBsmu9OVqtoXQr7oiEvzlPaMy+y3vIQpIEwgdqFIB8STFTYlDQnV6p6bTy5V5lU/QZpwLmZUHC21YxzjZO7awBkHccDhxEl1SzdBtR3l1e37wZtiemFbTkq44hpO2d5+0uY3/kK2eqAKyR2XZCeap7NRdk5hEm+tSGZhTZDbik42glXAkZGcRYSV0f0ftd8Tt4aoydSZaIJlJdaGlLx0FKFLcI/Jwe2NS111YkbppkpZ9n04Uu1ZBQKEc2EKfUnOydkeCkZJA4knJ37gBv/IQ/DL9B/wDYis8//r0x+dV+uJ/5Gt1W3bP2V/ZBW5Cl909x8z3U8G+c2ef2sZ442k/CIr/OKCpx5SSCkuKII6d8AcMThyVvwk/Rf8aIPicOSt+En6L/AI0TtO+kx8fYzl+Wf1LW/p9+JmuU79w9P90kfVORXWLFcp37h6f7pI+qciusZ6p9IfciNyE+qI/+UvaIQhFcdibZo96JlD9sf+Ji0N2/crV/aL31Zir2j3omUP2x/wCJi0N2/crV/aL31Zi+0v8A2J9/wPk3Lr61t+5e8ymUSjyeLp8qLnVQ5pzEpUyEt5O5D48H+14Pj2Yi6PppxbTqHWlqQtCgpKknBBHAiKahVdGoprqPpWp2FPULSdtU4SXofU/BlttULXRdloTVOSlPdaBz0oo9DqQcDPURlJ8cVOaXMSM8hxO0zMS7oUMjBQtJ/WCItppncyLrtCUqe0nulI5qaSPSupxnxZ3KHYREL8oi1PKm401+UbxJ1NRLuBuQ+PC/tDvvHtRb6lSVSCuIHzzkXfzs7qppNzu3vHeuK8VvXd5yerVrUrcNvSdYlFpU3MNBRA9IrgpJ7Qcj3orXrFZk1a9zPvtMKNKnHC5LOgd6kneWz1EHOOsY7cfWlGoc3Zk2qVfbVNUh9e08yD3zauG2jtxjI6cdHGLE0euWzd9OWmRm5KpsKT9tYWkEgfjNqGR74jPap6hSUW8SX+egi81eckb+dWEHOhL2dWX1Nefjv8KdxLXJ7sybna61dE6ypuQk8mW2x/TO4xkdick568duJjasSzW3w+i2aXtg5GZdJHwHdC67xtq0pMioTrLbjaMNybOC6rA3AIHAdpwIwo6cqEucqyWESdT5Z1NUouzsKMtqe59bw+OEvb1GP1mr7VAsKfVzoRNTiDKy6Qe+KljCiPEnJz4uuKpRs2ol5VG86yJ2cSllhoFEtLpOUtJJ37+lR3ZPZ1ARrMQL65VxUyuC4HW8ldElpNlsVPnyeX5uxeHtyIQhEI6Y2fSb0UbV92JX61MbXyi1Y1muD8pj6huNM04m25HUK3J15QS0xVZZxZJ3BIdSSfgjeOU7KPSesdVdcSQibaYeaJ6U80lBP9pCh70TKTxQff8AA5utu1+nnrpSx/ziaXTq7UKc0EST5l1AYDjSQlwb8+GBtfPGUf1Cvh+VEo9eFwOS4GA0upvKQB4irEantRudvJshVJZNTX/peDzu2pwYOejZ3YibYWrvajpqpGGFnMnhf/S3ua6t47Wy5dyyZfReUotduecbuMNTBDHONB90jaXtDJ4jaODwOY27VVNv0mrWkzT0U6US3UkuupYCU4QFI75WOjjvPbGk83pz6pv4x798Ob059U38Y9++L+OiyjT2OkUc9u3+RyF1Qdxfq7fO7KWNjZ3cGs/O8+eBL2r9QkRpxVQJyXJdbQlsBwErJWncOuMtZlSp6rMpDonpbYTIMhR50d6QgZB6sRBfN6c+qb+Me/fDm9OfVN/GPfviR8mT29rpFHhj5/6SifJum7NW2am6TlnY7UljG15uOTdNBqjI+XV1AzbKS9Moca2lgbadpzeOsbx8Ijp66VCSN625szTKuYIW9srB2BziTk9XAxq/N6c+qb+Me/fDm9OfVN/GPfvjT8jT5rm+kUf+fnz2FtHT6cdTd/s1N6xjY/7dnjnx4E6XpUqemzKu4Z6W2FSLwSedHfEoIAHXnMVP2o3OqIsEU6YMqvD/ADZ5rYU6TtY3cd3HrjRtqKjWaToTinOEt38Mtr07kWnJXSY6dSqRi5PLXzo7PxZzbUTFSTnkjXH7so+nLxC+1EzpBpvJDmjMYT5bVgGXz6bC08PiVfBFXSllS7mSuUK3Wy7a1P1PPsRCctNTUqVGWmXmCrwi2spz8EfUzPT0y3zcxOTDyM52XHSoZ68Ex14RAOlEIQgBCEIAR3qRV6tR3+fpNUnae76uVmFNK+FJEdGEAZmu3VdFeGK7clYqo/8ArJ5x76SjGGhCAEdpio1BhoNMT0002nglDqgB7wMdWEAd3y2qvrnO/Hq/fHWfeefcLj7q3VnipaiT8JjjhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAI5Gnnms806tvPHZURmOOEDxpPczkdffdTsuvOLAOcKUTHHCEAklwEIQgen0hSkKCkKKVDgQcERymbmiCDMvEHcQXDHBCGTxxT4oQhCB6cjT77QIaecbB4hKiI/XZh91Oy684tIOcKUSI4oQyY7KznAj6bWttYW2tSFjgpJwRHzCBlxMm5cFeclxLOVuprYHBtU0sp+DOIxpJJJJJJ4kx+Qj1yb4mEKUKfzEl3CEIR4ZiEIQAiwcuuma6WRJyK5xmTv2jMbCC8cCebA3nPTnGT6lWd2FRXyOSWfelphExLPOMvNqCkONqKVJI4EEbwY20quxlNZT4lVqmmdNUJ057FSDzGXHHamutNbmjM3JbFxW3Nrla5Rp2RcScZdaOwrtSod6odoJEYfaiTrc171Fo7CWHKhK1VtG5Pd7G2rHapJSo+MkmM155i+/Wm2/k7/wDNjbii/wCJrw/MhdL1un5MraEn2qo0n4ODa9LIX2obUTR55i+/Wm2/k7/82HnmL79abb+Tv/zYbNH7fq/M86drP8nH+7+ghfahtRNHnmL79abb+Tv/AM2HnmL79abb+Tv/AM2GzR+36vzHTtZ/k4/3f0EL7UNqJo88xffrTbfyd/8Amw88xffrTbfyd/8Amw2aP2/V+Y6drP8AJx/u/oIX2o/UbS1BKElSjwAGSYmfzzF9+tNt/J3/AObHy7ylb9W2pKabbrZI3KTLPZHwukQ2aP236PzHTta/k4/3f0GB000luG6JlM7VWHaJQGhzkzPTaeay2N52ArGd3pvBHSeg8mvN8UuvP061rVRzdtUNHNS+NwfWBgr378AbgTvOVHpjW721HvK8UlquVp52VzkSrQDTPZlKcBWOtWTGpRjOrFR2KfXxZsttNua9zG7v5LMc7MY52Y54tt75SxuzhJdSEIQiOX4hCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQAhCEAIQhACEIQB//Z";

// ─── PLAN CONSTANTS ────────────────────────────

const PLAN_LIMITS = {
  free: {
    name: "Free",
    price: "$0/mo",
    maxNiches: 25,
    maxKeywords: 100,
    maxInventory: 50,
    dceb: 0,
    seo: 0,
    trademark: 0,
    keywordAI: 0,
    briefs: 0,
    trendScan: 0,
    research: 0,
  },
  starter: {
    name: "Starter",
    price: "$9.99/mo",
    maxNiches: Infinity,
    maxKeywords: Infinity,
    maxInventory: Infinity,
    dceb: 10,
    seo: 10,
    trademark: 5,
    keywordAI: 5,
    briefs: 0,
    trendScan: 0,
    research: 0,
  },
  business: {
    name: "Business",
    price: "$19.99/mo",
    maxNiches: Infinity,
    maxKeywords: Infinity,
    maxInventory: Infinity,
    dceb: 40,
    seo: 40,
    trademark: 25,
    keywordAI: 25,
    briefs: 25,
    trendScan: 10,
    research: 25,
  },
};


function localDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function loadPlan() {
  try {
    const res = await fetch("/api/user/plan");
    if (!res.ok) return "free";
    const { plan } = await res.json();
    if (plan === "starter" || plan === "business") return plan;
    return "free";
  } catch {
    return "free";
  }
}

async function loadUsage() {
  const today = localDateKey();
  try {
    const r = await window.storage.get(`pod-usage-${today}`);
    return r ? JSON.parse(r.value) : {};
  } catch {
    return {};
  }
}

async function saveUsage(usage) {
  const today = localDateKey();
  try {
    await window.storage.set(`pod-usage-${today}`, JSON.stringify(usage));
  } catch (e) {
    console.error(e);
  }
}

// Returns true if allowed, false if limit hit
async function checkAndConsumeUsage(feature, planKey, currentUsage, setUsage) {
  const limit = PLAN_LIMITS[planKey]?.[feature] ?? 0;
  if (limit === 0) return false; // no access
  const used = currentUsage[feature] || 0;
  if (used >= limit) return false; // limit reached
  const next = { ...currentUsage, [feature]: used + 1 };
  setUsage(next);
  await saveUsage(next);
  return true;
}

// ─── STORAGE HELPERS ───────────────────────────
async function load(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}

async function save(key, data) {
  try {
    await window.storage.set(key, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

async function loadLocalTrackerState() {
  const entries = await Promise.all(
    Object.entries(STORAGE).map(async ([key, storageKey]) => [key, await load(storageKey)])
  );

  return Object.fromEntries(entries);
}

async function saveLocalTrackerState(tracker) {
  await Promise.all(
    Object.entries(STORAGE).map(async ([key, storageKey]) => {
      await save(storageKey, Array.isArray(tracker?.[key]) ? tracker[key] : []);
    })
  );
}

function normalizeTrackerState(tracker) {
  return Object.fromEntries(
    Object.keys(EMPTY_TRACKER_DATA).map((key) => [key, Array.isArray(tracker?.[key]) ? tracker[key] : []])
  );
}

function hasAnyTrackerData(tracker) {
  return Object.values(normalizeTrackerState(tracker)).some((items) => items.length > 0);
}

async function loadTrackerState() {
  try {
    const response = await fetch("/api/user/tracker", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load tracker state");

    const payload = await response.json();
    const serverTracker = normalizeTrackerState(payload?.tracker);

    if (payload?.exists) {
      await saveLocalTrackerState(serverTracker);
      return serverTracker;
    }

    const localTracker = normalizeTrackerState(await loadLocalTrackerState());
    if (hasAnyTrackerData(localTracker)) {
      try {
        await fetch("/api/user/tracker", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracker: localTracker }),
        });
      } catch (error) {
        console.error(error);
      }

      return localTracker;
    }

    return serverTracker;
  } catch (error) {
    console.error(error);
    return normalizeTrackerState(await loadLocalTrackerState());
  }
}

async function saveTrackerState(tracker) {
  const normalized = normalizeTrackerState(tracker);
  await saveLocalTrackerState(normalized);

  const response = await fetch("/api/user/tracker", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tracker: normalized }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to save tracker state");
  }

  return normalized;
}

function generateIdeaId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getNicheProfileId(niche) {
  return normalizeCompareValue(niche || "");
}


// ─── CSV IMPORT / EXPORT HELPERS ───────────────
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (!lines.length) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    rows.push(row);
  }

  return rows;
}

function normalizeHeaderKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getValue(row, aliases = []) {
  const normalized = Object.keys(row).reduce((acc, key) => {
    acc[normalizeHeaderKey(key)] = row[key];
    return acc;
  }, {});

  for (const alias of aliases) {
    const hit = normalized[normalizeHeaderKey(alias)];
    if (hit !== undefined) return hit;
  }

  return "";
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function mapImportedRows(type, rows) {
  if (!Array.isArray(rows)) return [];

  if (type === "niches") {
    return rows
      .map((row) => ({
        niche: getValue(row, ["niche"]),
        subNiche: getValue(row, ["subNiche", "sub niche", "sub_niche"]) || "General",
        demand: toNumber(getValue(row, ["demand"]), 0),
        competition: toNumber(getValue(row, ["competition"]), 0),
        evergreen: toNumber(getValue(row, ["evergreen"]), 0),
        brandability: toNumber(getValue(row, ["brandability"]), 0),
        score: getValue(row, ["score"]) || "",
        status: getValue(row, ["status"]) || "Researching",
        notes: getValue(row, ["notes"]) || "",
        date: getValue(row, ["date", "added"]) || todayISO(),
      }))
      .filter((item) => item.niche);
  }

  if (type === "keywords") {
    return rows
      .map((row) => ({
        keyword: getValue(row, ["keyword"]),
        niche: getValue(row, ["niche"]) || "",
        subNiche: getValue(row, ["subNiche", "sub niche", "sub_niche"]) || "",
        volume: getValue(row, ["volume"]) || "Medium",
        competition: getValue(row, ["competition"]) || "Medium",
        platforms: getValue(row, ["platforms", "platform"]) || "",
        status: getValue(row, ["status"]) || "Active",
        notes: getValue(row, ["notes"]) || "",
        date: getValue(row, ["date", "added"]) || todayISO(),
      }))
      .filter((item) => item.keyword);
  }

  if (type === "trends") {
    return rows
      .map((row) => ({
        trend: getValue(row, ["trend"]),
        source: getValue(row, ["source"]) || "",
        category: getValue(row, ["category"]) || "",
        seasonality: getValue(row, ["seasonality"]) || "Evergreen",
        peakMonths: getValue(row, ["peakMonths", "peak months", "peak_months"]) || "",
        score: toNumber(getValue(row, ["score"]), 5),
        notes: getValue(row, ["notes"]) || "",
        date: getValue(row, ["date", "spotted"]) || todayISO(),
      }))
      .filter((item) => item.trend);
  }

  if (type === "inventory") {
    return rows
      .map((row) => ({
        sku: getValue(row, ["sku"]),
        design: getValue(row, ["design", "design name"]) || "",
        briefId: getValue(row, ["briefId", "brief id"]) || "",
        platform: getValue(row, ["platform"]) || "Amazon Merch",
        url: getValue(row, ["url", "listing url"]) || "",
        imageUrl: getValue(row, ["imageUrl", "image url", "image", "thumbnail", "thumbnail url"]) || "",
        status: getValue(row, ["status"]) || "Active",
        notes: getValue(row, ["notes"]) || "",
        dateListed: getValue(row, ["dateListed", "date listed", "listed"]) || todayISO(),
        sales: toNumber(getValue(row, ["sales"]), 0),
      }))
      .filter((item) => item.sku);
  }

  return [];
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);

  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function formatCSVHeaderLabel(column) {
  return String(column)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function rowsToCSV(rows, columns) {
  const headerLine = columns.map((column) => csvEscape(formatCSVHeaderLabel(column))).join(",");
  const bodyLines = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(","));
  return [headerLine, ...bodyLines].join("\n");
}

function downloadCSV(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeCompareValue(value) {
  return String(value || "").trim().toLowerCase();
}

function makeDedupeKey(type, item) {
  if (type === "niches") {
    return [
      normalizeCompareValue(item.niche),
      normalizeCompareValue(item.subNiche || "General"),
    ].join("|");
  }

  if (type === "keywords") {
    return [
      normalizeCompareValue(item.keyword),
      normalizeCompareValue(item.niche),
      normalizeCompareValue(item.subNiche),
    ].join("|");
  }

  if (type === "trends") {
    return [
      normalizeCompareValue(item.trend),
      normalizeCompareValue(item.source),
    ].join("|");
  }

  if (type === "inventory") {
    return normalizeCompareValue(item.sku);
  }

  return JSON.stringify(item);
}

function dedupeImportedRows(type, existingRows, importedRows) {
  const existingKeys = new Set((existingRows || []).map((item) => makeDedupeKey(type, item)));
  const seenImported = new Set();
  const kept = [];
  let duplicateCount = 0;

  for (const row of importedRows || []) {
    const key = makeDedupeKey(type, row);

    if (existingKeys.has(key) || seenImported.has(key)) {
      duplicateCount++;
      continue;
    }

    seenImported.add(key);
    kept.push(row);
  }

  return {
    kept,
    duplicateCount,
  };
}

// ─── CLAUDE API ────────────────────────────────
async function askClaude(prompt, sys, feature) {
  try {
    const r = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature,
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:
          sys ||
          "You are a Print on Demand expert. Be concise and actionable. Focus on niches, keywords, SEO, and design concepts for Amazon Merch, Redbubble, Etsy, and TeeSpring.",
        prompt,
      }),
    });
    const d = await r.json();
    if (!r.ok) return `Error: ${d?.error || "Claude request failed"}`;
    return d?.text || "No response.";
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

async function askClaudeJSON(prompt, sys, feature) {
  try {
    const r = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature,
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:
          (sys || "You are a Print on Demand expert.") +
          "\n\nRespond ONLY with valid JSON array or object. No markdown, no backticks, no preamble.",
        prompt,
      }),
    });
    const d = await r.json();
    if (!r.ok) return null;
    const t = d?.text || "[]";
    return JSON.parse(t.replace("```json", "").replace("```", "").trim());
  } catch {
    return null;
  }
}

// ─── STYLES ────────────────────────────────────
const C = {
  bg: "#0e0e0e",
  surface: "#171717",
  surfaceHover: "#1f1f1f",
  card: "#1a1a1a",
  cardHover: "#222222",
  border: "#2a2a2a",
  borderLight: "#333333",
  accent: "#3b82f6",
  accentDim: "#1e3a5f",
  accentGlow: "rgba(59,130,246,0.15)",
  success: "#10b981",
  successDim: "#064e3b",
  warn: "#f59e0b",
  warnDim: "#78350f",
  danger: "#ef4444",
  dangerDim: "#7f1d1d",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  white: "#ffffff",
};

const font = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
const sansFont = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── COMPONENTS ────────────────────────────────
function Badge({ children, color = "accent" }) {
  const colors = {
    accent: { bg: C.accentDim, text: C.accent },
    success: { bg: C.successDim, text: C.success },
    warn: { bg: C.warnDim, text: C.warn },
    danger: { bg: C.dangerDim, text: C.danger },
  };
  const c = colors[color] || colors.accent;

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 17,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        fontFamily: font,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, color = C.accent }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "16px 20px",
        flex: 1,
        minWidth: 160,
        borderTop: `2px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: 17,
          color: C.textMuted,
          fontFamily: font,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 31, fontWeight: 700, color: C.white, fontFamily: sansFont }}>{value}</div>
      {sub && <div style={{ fontSize: 15, color: C.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, style: s }) {
  const variantMap = {
    primary: "contained",
    ghost: "outlined",
    danger: "contained",
    success: "contained",
  };

  const colorStyles = {
    primary: {
      background: "linear-gradient(180deg, #3b82f6 0%, #3b82f6 72%, #1d4ed8 100%)",
      border: "1px solid #60a5fa",
      color: C.white,
      "&:hover": {
        background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 68%, #1e40af 100%)",
        borderColor: "#93c5fd",
      },
    },
    ghost: {
      borderColor: "#94a3b8",
      color: "#cbd5e1",
      backgroundColor: "transparent",
      "&:hover": {
        borderColor: "#cbd5e1",
        backgroundColor: C.surfaceHover,
        color: C.white,
      },
    },
    danger: {
      backgroundColor: C.dangerDim,
      color: C.danger,
      "&:hover": { backgroundColor: "#991b1b" },
    },
    success: {
      backgroundColor: C.successDim,
      color: C.success,
      "&:hover": { backgroundColor: "#065f46" },
    },
  };

  return (
    <Button
      disableElevation
      variant={variantMap[variant] || "contained"}
      onClick={onClick}
      disabled={disabled}
      sx={{
        textTransform: "none",
        borderRadius: "6px",
        px: 2,
        py: 1,
        minWidth: "auto",
        fontFamily: font,
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.3px",
        lineHeight: 1.2,
        boxShadow: "none",
        "&.Mui-disabled": {
          color: "#94a3b8",
          borderColor: "#64748b",
          backgroundColor: "rgba(148, 163, 184, 0.08)",
          opacity: 0.8,
        },
        ...colorStyles[variant],
        ...s,
      }}
    >
      {children}
    </Button>
  );
}

// Disabled button with upgrade tooltip for locked features
// eslint-disable-next-line no-unused-vars
function LockedBtnLegacy({ children, tooltip = "Upgrade to Starter or Business to unlock AI features.", style: s }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        title={tooltip}
        disabled
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "8px 16px",
          borderRadius: 6,
          border: `1px solid ${C.border}`,
          cursor: "not-allowed",
          fontFamily: font,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "0.3px",
          background: "transparent",
          color: C.textMuted,
          opacity: 0.6,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          ...s,
        }}
      >
        🔒 {children}
      </button>
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            border: `1px solid ${C.accentDim}`,
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 13,
            color: C.accent,
            whiteSpace: "nowrap",
            fontFamily: font,
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          {tooltip}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${C.accentDim}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function LockedBtn({ children, tooltip = "Upgrade to Starter or Business to unlock AI features.", style: s }) {
  return (
    <Tooltip
      title={tooltip}
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: C.card,
            border: `1px solid ${C.accentDim}`,
            color: C.accent,
            fontFamily: font,
            fontSize: 13,
          },
        },
      }}
    >
      <span>
        <Button
          disabled
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: "6px",
            borderColor: "#94a3b8",
            color: "#cbd5e1",
            opacity: 0.9,
            fontFamily: font,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.3px",
            minWidth: "auto",
            px: 2,
            py: 1,
            "&.Mui-disabled": {
              color: "#94a3b8",
              borderColor: "#94a3b8",
              backgroundColor: "rgba(148, 163, 184, 0.08)",
            },
            ...s,
          }}
        >
          Locked {children}
        </Button>
      </span>
    </Tooltip>
  );
}

// Usage counter badge
function UsageBadge({ used, limit }) {
  if (!limit) return null;
  const pct = used / limit;
  const color = pct >= 1 ? C.danger : pct >= 0.8 ? C.warn : C.success;
  return (
    <span
      style={{
        fontSize: 13,
        fontFamily: font,
        color,
        background: pct >= 1 ? C.dangerDim : pct >= 0.8 ? C.warnDim : C.successDim,
        padding: "2px 8px",
        borderRadius: 4,
        marginLeft: 6,
      }}
    >
      {used}/{limit} today
    </span>
  );
}

function Input({ value, onChange, placeholder, style: s, ...props }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        color: C.text,
        fontFamily: font,
        fontSize: 15,
        outline: "none",
        width: "100%",
        ...s,
      }}
      {...props}
    />
  );
}

function NicheLink({ niche, subNiche = "", onOpen, children, style: s }) {
  const label = children || (subNiche || niche);

  if (!niche || !label) {
    return label || "—";
  }

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={() => onOpen?.(niche, subNiche)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(niche, subNiche);
        }
      }}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        color: C.accent,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: 3,
        textAlign: "left",
        display: "inline",
        ...s,
      }}
    >
      {label}
    </span>
  );
}

function Select({ value, onChange, options, placeholder, style: s }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        color: C.text,
        fontFamily: font,
        fontSize: 15,
        outline: "none",
        ...s,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3, style: s }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        color: C.text,
        fontFamily: font,
        fontSize: 15,
        outline: "none",
        width: "100%",
        resize: "vertical",
        ...s,
      }}
    />
  );
}

function ListingImagePreview({ src, alt = "Listing image" }) {
  const [hasError, setHasError] = useState(false);
  const trimmedSrc = String(src || "").trim();

  useEffect(() => {
    setHasError(false);
  }, [trimmedSrc]);

  if (!trimmedSrc) {
    return <span style={{ color: C.textMuted }}>-</span>;
  }

  if (hasError) {
    return <span style={{ color: C.textMuted, fontSize: 13 }}>Invalid image</span>;
  }

  return (
    <a href={trimmedSrc} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
      <img
        src={trimmedSrc}
        alt={alt}
        onError={() => setHasError(true)}
        style={{
          width: 56,
          height: 56,
          objectFit: "cover",
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.surface,
        }}
      />
    </a>
  );
}

// eslint-disable-next-line no-unused-vars
function TableLegacy({ columns, data, onDelete, onUpdate, exampleRow, onCreateExample }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftRow, setDraftRow] = useState({});
  const showExample = !data.length && !!exampleRow;
  const displayRows = showExample ? [exampleRow] : data;

  const startEdit = (index, row) => {
    setEditingIndex(index);
    setDraftRow(
      Object.fromEntries(columns.map((column) => [column.key, row?.[column.key] ?? ""]))
    );
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftRow({});
  };

  const saveEdit = async (index, row) => {
    if (showExample && onCreateExample) {
      await onCreateExample({ ...row, ...draftRow });
      cancelEdit();
      return;
    }

    if (!onUpdate) {
      cancelEdit();
      return;
    }

    await onUpdate(index, { ...row, ...draftRow });
    cancelEdit();
  };

  if (!displayRows.length) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: C.textMuted,
          fontFamily: font,
          fontSize: 19,
        }}
      >
        No data yet. Add your first entry above.
      </div>
    );
  }

  return (
    <div>
      {showExample && (
        <div
          style={{
            marginBottom: 10,
            color: C.textMuted,
            fontSize: 14,
            fontFamily: font,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Edit and save this example to create your first entry.
        </div>
      )}
      <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${C.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 15 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  background: C.surface,
                  color: C.textMuted,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontSize: 19,
                  borderBottom: `1px solid ${C.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </th>
            ))}
            {(showExample ? !!onCreateExample : (onUpdate || onDelete)) && (
              <th
                style={{
                  padding: "10px 12px",
                  background: C.surface,
                  borderBottom: `1px solid ${C.border}`,
                  width: 120,
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? C.card : "transparent",
                opacity: showExample ? 0.92 : 1,
              }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: "8px 12px",
                    color: C.text,
                    borderBottom: `1px solid ${C.border}`,
                    maxWidth: c.maxW || 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: editingIndex === i ? "normal" : "nowrap",
                  }}
                >
                  {editingIndex === i ? (
                    <Input
                      value={draftRow[c.key] ?? ""}
                      onChange={(value) =>
                        setDraftRow((prev) => ({ ...prev, [c.key]: value }))
                      }
                      style={{ minWidth: 120 }}
                    />
                  ) : c.render ? (
                    c.render(row[c.key], row)
                  ) : (
                    row[c.key]
                  )}
                </td>
              ))}
              {(showExample ? !!onCreateExample : (onUpdate || onDelete)) && (
                <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
                  {(showExample ? !!onCreateExample : !!onUpdate) &&
                    (editingIndex === i ? (
                      <>
                        <button
                          onClick={() => saveEdit(i, row)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.success,
                            cursor: "pointer",
                            fontSize: 15,
                            fontFamily: font,
                            marginRight: 8,
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.textMuted,
                            cursor: "pointer",
                            fontSize: 15,
                            fontFamily: font,
                            marginRight: 8,
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(i, row)}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.accent,
                          cursor: "pointer",
                          fontSize: 15,
                          fontFamily: font,
                          marginRight: 8,
                        }}
                      >
                        {showExample ? "Use Example" : "Edit"}
                      </button>
                    ))}
                  {!showExample && onDelete && (
                  <button
                    onClick={() => onDelete(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.danger,
                      cursor: "pointer",
                      fontSize: 17,
                    }}
                  >
                    ✕
                  </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

function Table({ columns, data, onDelete, onUpdate, exampleRow, onCreateExample }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftRow, setDraftRow] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const showExample = !data.length && !!exampleRow;
  const displayRows = useMemo(() => (showExample ? [exampleRow] : data), [data, exampleRow, showExample]);
  const hasActions = showExample ? !!onCreateExample : !!(onUpdate || onDelete);
  const hasControls = !showExample && data.length > 0;

  const filterableColumns = useMemo(
    () => columns.filter((column) => column.filterable || Array.isArray(column.filterOptions)),
    [columns]
  );

  const filterOptionsMap = useMemo(() => {
    return Object.fromEntries(
      filterableColumns.map((column) => {
        const options = Array.isArray(column.filterOptions)
          ? column.filterOptions
          : Array.from(
              new Set(
                (data || [])
                  .map((row) => row?.[column.key])
                  .filter((value) => value !== undefined && value !== null && value !== "")
                  .map((value) => String(value))
              )
            );

        return [column.key, options];
      })
    );
  }, [data, filterableColumns]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return displayRows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        columns.some((column) => {
          const rawValue = row?.[column.key];
          return String(rawValue ?? "").toLowerCase().includes(normalizedSearch);
        });

      const matchesFilters = filterableColumns.every((column) => {
        const selected = filterValues[column.key];
        if (!selected) return true;
        return String(row?.[column.key] ?? "") === selected;
      });

      return matchesSearch && matchesFilters;
    });
  }, [columns, displayRows, filterValues, filterableColumns, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return filteredRows;

    const sortColumn = columns.find((column) => column.key === sortConfig.key);
    if (!sortColumn) return filteredRows;

    const normalizeSortValue = (value) => {
      if (value === null || value === undefined || value === "") return { type: "empty", value: "" };

      if (typeof value === "number") return { type: "number", value };

      const stringValue = String(value).trim();
      const numericValue = Number(stringValue);
      if (!Number.isNaN(numericValue) && stringValue !== "") {
        return { type: "number", value: numericValue };
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
        const timeValue = Date.parse(stringValue);
        if (!Number.isNaN(timeValue)) {
          return { type: "date", value: timeValue };
        }
      }

      return { type: "string", value: stringValue.toLowerCase() };
    };

    const rows = [...filteredRows];
    rows.sort((leftRow, rightRow) => {
      const left = normalizeSortValue(leftRow?.[sortConfig.key]);
      const right = normalizeSortValue(rightRow?.[sortConfig.key]);

      if (left.type === "empty" && right.type !== "empty") return 1;
      if (left.type !== "empty" && right.type === "empty") return -1;

      let comparison = 0;
      if (left.value < right.value) comparison = -1;
      if (left.value > right.value) comparison = 1;

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [columns, filteredRows, sortConfig]);

  const toggleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: columnKey,
        direction: "asc",
      };
    });
  };

  const startEdit = (index, row) => {
    setEditingIndex(index);
    setDraftRow(Object.fromEntries(columns.map((column) => [column.key, row?.[column.key] ?? ""])));
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftRow({});
  };

  const saveEdit = async (index, row) => {
    if (showExample && onCreateExample) {
      await onCreateExample({ ...row, ...draftRow });
      cancelEdit();
      return;
    }

    if (!onUpdate) {
      cancelEdit();
      return;
    }

    await onUpdate(index, { ...row, ...draftRow });
    cancelEdit();
  };

  if (!displayRows.length) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: C.textMuted,
          fontFamily: font,
          fontSize: 19,
        }}
      >
        No data yet. Add your first entry above.
      </div>
    );
  }

  return (
    <div>
      {showExample && (
        <div
          style={{
            marginBottom: 10,
            color: C.textMuted,
            fontSize: 14,
            fontFamily: font,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Edit and save this example to create your first entry.
        </div>
      )}
      {hasControls && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rows"
            size="small"
            sx={{
              minWidth: 240,
              "& .MuiOutlinedInput-root": {
                backgroundColor: C.surface,
                color: C.text,
                fontFamily: font,
                "& fieldset": { borderColor: C.border },
                "&:hover fieldset": { borderColor: C.borderLight },
                "&.Mui-focused fieldset": { borderColor: "#94a3b8" },
              },
              "& input": {
                fontFamily: font,
                fontSize: 14,
              },
            }}
          />
          {filterableColumns.map((column) => (
            <FormControl
              key={column.key}
              size="small"
              sx={{
                minWidth: 170,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: C.surface,
                  color: C.text,
                  fontFamily: font,
                  "& fieldset": { borderColor: C.border },
                  "&:hover fieldset": { borderColor: C.borderLight },
                  "&.Mui-focused fieldset": { borderColor: "#94a3b8" },
                },
                "& .MuiSelect-select": {
                  fontFamily: font,
                  fontSize: 14,
                },
              }}
            >
              <MuiSelect
                displayEmpty
                value={filterValues[column.key] || ""}
                onChange={(e) =>
                  setFilterValues((prev) => ({ ...prev, [column.key]: e.target.value }))
                }
              >
                <MenuItem value="">{`All ${column.label}`}</MenuItem>
                {(filterOptionsMap[column.key] || []).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          ))}
        </Box>
      )}
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          overflowX: "auto",
          boxShadow: "none",
        }}
      >
        <MuiTable size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: C.surface }}>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  sx={{
                    color: C.textMuted,
                    fontFamily: font,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: `1px solid ${C.border}`,
                    whiteSpace: "nowrap",
                    minWidth: c.minW,
                    width: c.width,
                  }}
                >
                  {c.sortable !== false ? (
                    <TableSortLabel
                      active={sortConfig.key === c.key}
                      direction={sortConfig.key === c.key ? sortConfig.direction : "asc"}
                      onClick={() => toggleSort(c.key)}
                      sx={{
                        color: `${C.textMuted} !important`,
                        "& .MuiTableSortLabel-icon": {
                          color: `${C.textMuted} !important`,
                        },
                        "&.Mui-active": {
                          color: `${C.white} !important`,
                        },
                        "&.Mui-active .MuiTableSortLabel-icon": {
                          color: `${C.white} !important`,
                        },
                      }}
                    >
                      {c.label}
                    </TableSortLabel>
                  ) : (
                    c.label
                  )}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell
                  sx={{
                    width: 150,
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: C.surface,
                  }}
                />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, i) => (
              <TableRow
                key={i}
                sx={{
                  backgroundColor: i % 2 === 0 ? C.card : "transparent",
                  opacity: showExample ? 0.92 : 1,
                  "& td": { borderBottom: `1px solid ${C.border}` },
                }}
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    sx={{
                      color: C.text,
                      fontFamily: font,
                      fontSize: 15,
                      minWidth: c.minW,
                      width: c.width,
                      maxWidth: c.maxW || 220,
                      verticalAlign: "top",
                    }}
                  >
                    {editingIndex === i ? (
                      <Input
                        value={draftRow[c.key] ?? ""}
                        onChange={(value) => setDraftRow((prev) => ({ ...prev, [c.key]: value }))}
                        style={{ minWidth: 120 }}
                      />
                    ) : c.render ? (
                      c.render(row[c.key], row)
                    ) : (
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: c.maxW || 220,
                        }}
                      >
                        {row[c.key]}
                      </div>
                    )}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {(showExample ? !!onCreateExample : !!onUpdate) &&
                      (editingIndex === i ? (
                        <>
                          <Button
                            size="small"
                            onClick={() => saveEdit(i, row)}
                            sx={{
                              mr: 1,
                              color: C.success,
                              minWidth: "auto",
                              fontFamily: font,
                              textTransform: "none",
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={cancelEdit}
                            sx={{
                              mr: 1,
                              color: C.textMuted,
                              minWidth: "auto",
                              fontFamily: font,
                              textTransform: "none",
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="small"
                          onClick={() => startEdit(i, row)}
                          sx={{
                            mr: 1,
                            color: C.accent,
                            minWidth: "auto",
                            fontFamily: font,
                            textTransform: "none",
                          }}
                        >
                          {showExample ? "Use Example" : "Edit"}
                        </Button>
                      ))}
                    {!showExample && onDelete && (
                      <Button
                        size="small"
                        onClick={() => onDelete(i)}
                        sx={{
                          color: C.danger,
                          minWidth: "auto",
                          fontFamily: font,
                          textTransform: "none",
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!sortedRows.length && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  sx={{
                    color: C.textMuted,
                    fontFamily: font,
                    textAlign: "center",
                    py: 4,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  No matching rows.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 16,
        color: C.accent,
        fontFamily: font,
        fontSize: 19,
      }}
    >
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>✦</span> Researching...
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CSVImportButton({ label, type, existingRows = [], onImport }) {
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const mapped = mapImportedRows(type, parsed);

      if (!mapped.length) {
        alert(`No valid ${type} rows found in that CSV.`);
        e.target.value = "";
        return;
      }

      const wantsDedupe = window.confirm(
        `Import ${mapped.length} ${type} row${mapped.length === 1 ? "" : "s"}?\n\n` +
          `Click OK to skip duplicates.\n` +
          `Click Cancel to append everything.`
      );

      let finalRows = mapped;
      let duplicateCount = 0;

      if (wantsDedupe) {
        const result = dedupeImportedRows(type, existingRows, mapped);
        finalRows = result.kept;
        duplicateCount = result.duplicateCount;
      }

      if (!finalRows.length) {
        alert(
          duplicateCount > 0
            ? `Nothing imported. All ${mapped.length} row${mapped.length === 1 ? "" : "s"} matched existing data or duplicates in the file.`
            : "Nothing to import."
        );
        e.target.value = "";
        return;
      }

      onImport(finalRows);

      if (wantsDedupe) {
        alert(
          `Imported ${finalRows.length} ${type} row${finalRows.length === 1 ? "" : "s"}.\n` +
            `Skipped ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"}.`
        );
      } else {
        alert(`Imported ${finalRows.length} ${type} row${finalRows.length === 1 ? "" : "s"}.`);
      }
    } catch (err) {
      console.error(err);
      alert("Could not import CSV. Check the file format.");
    }

    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <Btn variant="ghost" onClick={() => fileRef.current?.click()}>
        {label}
      </Btn>
    </>
  );
}

function CSVExportButton({ label, filename, rows, columns }) {
  const handleExport = () => {
    if (!rows || !rows.length) {
      alert("No data to export.");
      return;
    }

    const csv = rowsToCSV(rows, columns);
    downloadCSV(filename, csv);
  };

  return (
    <Btn variant="ghost" onClick={handleExport}>
      {label}
    </Btn>
  );
}

function CSVSampleButton({ label, filename, columns, sampleRow }) {
  const handleDownload = () => {
    const csv = rowsToCSV([sampleRow], columns);
    downloadCSV(filename, csv);
  };

  return (
    <Btn variant="ghost" onClick={handleDownload}>
      {label}
    </Btn>
  );
}

// ─── MAIN APP ──────────────────────────────────
export default function PODTracker() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState({ "research-group": true, "design-group": true });
  const [selectedNicheContext, setSelectedNicheContext] = useState(null);
  const [data, setData] = useState(EMPTY_TRACKER_DATA);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("free");
  const [usage, setUsage] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const syncSidebarState = (event) => {
      setIsSidebarCollapsed(event.matches);
    };

    setIsSidebarCollapsed(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncSidebarState);
      return () => mediaQuery.removeEventListener("change", syncSidebarState);
    }

    mediaQuery.addListener(syncSidebarState);
    return () => mediaQuery.removeListener(syncSidebarState);
  }, []);

  useEffect(() => {
    (async () => {
      const d = await loadTrackerState();
      const p = await loadPlan();
      const u = await loadUsage();
      setData(d);
      setPlan(p);
      setUsage(u);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const activeGroup = TABS.find((item) => item.children?.some((child) => child.id === tab));
    if (!activeGroup) return;

    setOpenNavGroups((prev) => (
      prev[activeGroup.id] ? prev : { ...prev, [activeGroup.id]: true }
    ));
  }, [tab]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const pendingName = window.localStorage.getItem("podtrackerpro_signup_name");
    const trimmedName = pendingName?.trim();

    if (!trimmedName) {
      return;
    }

    if (session?.user?.name === trimmedName) {
      window.localStorage.removeItem("podtrackerpro_signup_name");
      return;
    }

    apiClient
      .post("/user/profile", { name: trimmedName })
      .then(() => {
        window.localStorage.removeItem("podtrackerpro_signup_name");
      })
      .catch(() => {});
  }, [session?.user?.name, status]);

  const update = useCallback(async (key, newData) => {
    let nextState;
    setData((prev) => {
      nextState = { ...prev, [key]: newData };
      return nextState;
    });
    await saveTrackerState(nextState);
  }, []);

  const addItem = useCallback(
    async (key, item) => {
      const next = [...data[key], item];
      await update(key, next);
    },
    [data, update]
  );

  const importItems = useCallback(
    async (key, items) => {
      const next = [...data[key], ...items];
      await update(key, next);
    },
    [data, update]
  );

  const deleteItem = useCallback(
    async (key, idx) => {
      const next = data[key].filter((_, i) => i !== idx);
      await update(key, next);
    },
    [data, update]
  );

  const updateItem = useCallback(
    async (key, idx, item) => {
      const next = data[key].map((existing, i) => (i === idx ? item : existing));
      await update(key, next);
    },
    [data, update]
  );

  const openNicheHome = useCallback((niche, subNiche = "") => {
    if (!niche) return;
    setSelectedNicheContext({ niche, subNiche: subNiche || "" });
    setTab("niche-home");
  }, []);

  if (!loaded) {
    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: sansFont, color: C.text }}>
      <div
        style={{
          width: isSidebarCollapsed ? 72 : 200,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "visible",
          transition: "width 0.18s ease",
          zIndex: 5,
        }}
      >
      <nav
        style={{
          width: "100%",
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          padding: "16px 0",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            padding: isSidebarCollapsed ? "12px 10px 16px" : "12px 16px 16px",
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Image
              src="/podtrackerpro-logo.png"
              alt="PODTrackerPro"
              width={168}
              height={31}
              unoptimized
              style={{
                width: "100%",
                maxWidth: isSidebarCollapsed ? 36 : 168,
                height: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                aria-label="Collapse sidebar"
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.textDim,
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  fontFamily: font,
                  flexShrink: 0,
                  display: "none",
                }}
              >
                ←
              </button>
            )}
          </div>
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              aria-label="Expand sidebar"
              style={{
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.textDim,
                borderRadius: 6,
                width: 36,
                height: 28,
                cursor: "pointer",
                fontFamily: font,
                margin: "10px auto 0",
                display: "none",
              }}
            >
              →
            </button>
          )}
        </div>

        {TABS.map((t) => {
          if (t.children?.length) {
            const isGroupActive = t.children.some((child) => child.id === tab);
            const isGroupOpen = isSidebarCollapsed ? true : openNavGroups[t.id] !== false;

            return (
              <div key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (isSidebarCollapsed) return;
                    setOpenNavGroups((prev) => ({ ...prev, [t.id]: !isGroupOpen }));
                  }}
                  title={isSidebarCollapsed ? t.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isSidebarCollapsed ? "center" : "space-between",
                    gap: 10,
                    padding: isSidebarCollapsed ? "10px 0" : "10px 20px 8px",
                    color: isGroupActive ? C.white : C.textMuted,
                    fontFamily: font,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: isSidebarCollapsed ? "default" : "pointer",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, width: 18, textAlign: "center" }}>{t.icon}</span>
                    {!isSidebarCollapsed && t.label}
                  </span>
                  {!isSidebarCollapsed && (
                    <span style={{ fontSize: 14, color: isGroupActive ? C.white : C.textDim }}>
                      {isGroupOpen ? "▾" : "▸"}
                    </span>
                  )}
                </button>
                {isGroupOpen && t.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setTab(child.id)}
                    title={isSidebarCollapsed ? child.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                      gap: 10,
                      padding: isSidebarCollapsed ? "10px 0" : "10px 20px 10px 34px",
                      border: "none",
                      cursor: "pointer",
                      background: tab === child.id ? C.accentGlow : "transparent",
                      color: tab === child.id ? C.accent : C.textDim,
                      fontFamily: font,
                      fontSize: 15,
                      textAlign: "left",
                      borderRight: tab === child.id ? `2px solid ${C.accent}` : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 17, width: 18, textAlign: "center" }}>{child.icon}</span>
                    {!isSidebarCollapsed && child.label}
                  </button>
                ))}
              </div>
            );
          }

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={isSidebarCollapsed ? t.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                gap: 10,
                padding: isSidebarCollapsed ? "10px 0" : "10px 20px",
                border: "none",
                cursor: "pointer",
                background: tab === t.id ? C.accentGlow : "transparent",
                color: tab === t.id ? C.accent : C.textDim,
                fontFamily: font,
                fontSize: 15,
                textAlign: "left",
                borderRight: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 17, width: 18, textAlign: "center" }}>{t.icon}</span>
              {!isSidebarCollapsed && t.label}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        {BOTTOM_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (t.id === "improve-ptp") {
                window.open(CANNY_BOARD_URL, "_blank", "noopener,noreferrer");
                return;
              }
              setTab(t.id);
            }}
            title={isSidebarCollapsed ? t.label : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              gap: 10,
              padding: isSidebarCollapsed ? "10px 0" : "10px 20px",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: C.textDim,
              fontFamily: font,
              fontSize: 15,
              textAlign: "left",
              borderRight: "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 17, width: 18, textAlign: "center" }}>{t.icon}</span>
            {!isSidebarCollapsed && t.label}
          </button>
        ))}

        {/* Plan badge in sidebar */}
        <div
          style={{
            padding: isSidebarCollapsed ? "10px 8px" : "10px 16px",
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 4,
          }}
        >
          {isSidebarCollapsed ? (
            <div
              title={`Current plan: ${PLAN_LIMITS[plan].name}`}
              style={{
                fontSize: 13,
                color: plan === "business" ? C.warn : plan === "starter" ? C.accent : C.textDim,
                fontFamily: font,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {PLAN_LIMITS[plan].name.charAt(0)}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Current Plan
            </div>
          )}
          {!isSidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontFamily: font,
                fontSize: 14,
                fontWeight: 700,
                color: plan === "business" ? C.warn : plan === "starter" ? C.accent : C.textDim,
              }}
            >
              {PLAN_LIMITS[plan].name}
            </span>
            {plan === "free" && (
              <a
                href="/pricing"
                style={{ fontSize: 11, color: C.accent, fontFamily: font, textDecoration: "none" }}
              >
                Upgrade ↗
              </a>
            )}
            </div>
          )}
        </div>

        <div
          style={{
            padding: isSidebarCollapsed ? "12px 8px" : "12px 20px",
            fontSize: 19,
            color: C.textMuted,
            fontFamily: font,
            textAlign: isSidebarCollapsed ? "center" : "left",
          }}
        >
          {isSidebarCollapsed ? `${data.niches.length}/${data.inventory.length}` : `${data.niches.length} niches · ${data.inventory.length} listings`}
        </div>
      </nav>
      <button
        onClick={() => setIsSidebarCollapsed((prev) => !prev)}
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "absolute",
          top: "50%",
          right: -14,
          transform: "translateY(-50%)",
          width: 28,
          height: 72,
          border: `1px solid ${C.border}`,
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
          background: C.card,
          color: C.textDim,
          cursor: "pointer",
          fontFamily: font,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.28)",
        }}
      >
        {isSidebarCollapsed ? ">" : "<"}
      </button>
      </div>

      <main style={{ flex: 1, padding: 32, overflowY: "auto", maxHeight: "100vh" }}>
        {tab === "dashboard" && <DashboardView data={data} setTab={setTab} plan={plan} usage={usage} openNicheHome={openNicheHome} />}
        {tab === "niche-home" && (
          <NicheHomeView
            data={data}
            selectedNicheContext={selectedNicheContext}
            setSelectedNicheContext={setSelectedNicheContext}
            openNicheHome={openNicheHome}
            plan={plan}
            usage={usage}
            setUsage={setUsage}
            loading={loading}
            setLoading={setLoading}
            addItem={addItem}
            updateItem={updateItem}
          />
        )}
        {tab === "niches" && (
          <NichesView
            data={data}
            addItem={addItem}
            deleteItem={deleteItem}
            updateItem={updateItem}
            importItems={importItems}
            loading={loading}
            setLoading={setLoading}
            plan={plan}
            usage={usage}
            setUsage={setUsage}
            openNicheHome={openNicheHome}
          />
        )}
        {tab === "keywords" && (
          <KeywordsView
            data={data}
            addItem={addItem}
            deleteItem={deleteItem}
            updateItem={updateItem}
            importItems={importItems}
            loading={loading}
            setLoading={setLoading}
            plan={plan}
            usage={usage}
            setUsage={setUsage}
            openNicheHome={openNicheHome}
          />
        )}
        {tab === "trends" && (
          <TrendsView
            data={data}
            addItem={addItem}
            deleteItem={deleteItem}
            updateItem={updateItem}
            importItems={importItems}
            loading={loading}
            setLoading={setLoading}
            plan={plan}
            usage={usage}
            setUsage={setUsage}
          />
        )}
        {tab === "briefs" && (
          <BriefsView data={data} addItem={addItem} deleteItem={deleteItem} updateItem={updateItem} loading={loading} setLoading={setLoading} plan={plan} usage={usage} setUsage={setUsage} openNicheHome={openNicheHome} />
        )}
        {tab === "seo" && (
          <SEOView data={data} addItem={addItem} deleteItem={deleteItem} updateItem={updateItem} loading={loading} setLoading={setLoading} plan={plan} usage={usage} setUsage={setUsage} openNicheHome={openNicheHome} />
        )}
        {tab === "ideas" && (
            <IdeasView data={data} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} update={update} openNicheHome={openNicheHome} />
        )}
        {tab === "inventory" && (
          <InventoryView data={data} addItem={addItem} deleteItem={deleteItem} updateItem={updateItem} importItems={importItems} plan={plan} />
        )}
        {tab === "trademark" && <TrademarkView loading={loading} setLoading={setLoading} plan={plan} usage={usage} setUsage={setUsage} />}
        {tab === "research" && <ResearchView data={data} loading={loading} setLoading={setLoading} plan={plan} usage={usage} setUsage={setUsage} />}
        {tab === "guide" && <GuideView plan={plan} />}
      </main>
    </div>
  );
}

// ─── DASHBOARD VIEW ────────────────────────────
function DashboardView({ data, setTab, plan, usage, openNicheHome }) {
  const activeListings = data.inventory.filter((i) => i.status === "Active").length;
  const byPlatform = PLATFORMS.map((p) => ({
    platform: p,
    count: data.inventory.filter((i) => i.platform === p).length,
  }));
  const recentTrends = data.trends.slice(-5).reverse();
  const recentNiches = data.niches.slice(-5).reverse();
  const pendingBriefs = data.briefs.filter((b) => b.status !== "Listed" && b.status !== "Rejected").length;
  const limits = PLAN_LIMITS[plan];

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px", fontFamily: sansFont }}>Dashboard</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Print on Demand business overview
      </p>

      {/* Plan summary banner */}
      <div
        style={{
          background: plan === "business" ? C.warnDim : plan === "starter" ? C.accentDim : C.surface,
          border: `1px solid ${plan === "business" ? C.warn : plan === "starter" ? C.accentDim : C.border}`,
          borderRadius: 8,
          padding: "12px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: font, fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Plan:</span>
          <span style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: plan === "business" ? C.warn : plan === "starter" ? C.accent : C.textDim }}>
            {limits.name} — {limits.price}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {["dceb", "seo", "trademark", "keywordAI", "briefs", "trendScan", "research"].map((feat) => {
            const lim = limits[feat];
            if (!lim) return null;
            return (
              <span key={feat} style={{ fontFamily: font, fontSize: 12, color: C.textDim }}>
                {feat}: <span style={{ color: (usage[feat] || 0) >= lim ? C.danger : C.success, fontWeight: 700 }}>{usage[feat] || 0}/{lim}</span>
              </span>
            );
          })}
        </div>
        {plan === "free" && (
          <a href="/pricing" style={{ fontSize: 13, color: C.accent, fontFamily: font, fontWeight: 600, textDecoration: "none" }}>
            Upgrade for AI features ↗
          </a>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <StatCard
          label="Niches Tracked"
          value={data.niches.length}
          sub={`${data.niches.filter((n) => n.status === "Validated").length} validated`}
        />
        <StatCard label="Active Listings" value={activeListings} sub={`${data.inventory.length} total`} color={C.success} />
        <StatCard label="Design Briefs" value={pendingBriefs} sub="pending action" color={C.warn} />
        <StatCard label="Keywords" value={data.keywords.length} sub="in research" color="#8b5cf6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <h3
            style={{
              fontSize: 19,
              fontFamily: font,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              margin: "0 0 16px",
            }}
          >
            Listings by Platform
          </h3>
          {byPlatform.map((p) => (
            <div
              key={p.platform}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: 19, color: C.text }}>{p.platform}</span>
              <span style={{ fontSize: 21, fontWeight: 700, color: C.white, fontFamily: font }}>{p.count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <h3
            style={{
              fontSize: 19,
              fontFamily: font,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              margin: "0 0 16px",
            }}
          >
            Recent Trends
          </h3>
          {recentTrends.length === 0 ? (
            <div style={{ color: C.textMuted, fontSize: 19, padding: 16 }}>
              No trends logged yet. Use the{" "}
              <button
                onClick={() => setTab("trends")}
                style={{
                  background: "none",
                  border: "none",
                  color: C.accent,
                  cursor: "pointer",
                  fontFamily: font,
                  fontSize: 19,
                }}
              >
                Trends
              </button>{" "}
              tab or{" "}
              <button
                onClick={() => setTab("research")}
                style={{
                  background: "none",
                  border: "none",
                  color: C.accent,
                  cursor: "pointer",
                  fontFamily: font,
                  fontSize: 19,
                }}
              >
                AI Research
              </button>
              .
            </div>
          ) : (
            recentTrends.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 19, color: C.text }}>{t.trend}</div>
                  <div style={{ fontSize: 17, color: C.textMuted }}>
                    {t.source} · {t.category}
                  </div>
                </div>
                <Badge color={t.score >= 7 ? "success" : t.score >= 5 ? "warn" : "danger"}>{t.score + " of 10"}</Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
        <h3 style={{ fontSize: 19, fontFamily: font, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 16px" }}>
          Recent Niches
        </h3>
        {recentNiches.length ? recentNiches.map((item, index) => (
          <div key={`${item.niche}-${item.subNiche}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: index < recentNiches.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <NicheLink niche={item.niche} subNiche={item.subNiche} onOpen={openNicheHome} style={{ fontSize: 18 }}>
                {item.niche}{item.subNiche ? ` / ${item.subNiche}` : ""}
              </NicheLink>
              <div style={{ color: C.textMuted, fontSize: 14 }}>{item.status || "Researching"}</div>
            </div>
            <Badge color={Number(item.score) >= 7 ? "success" : Number(item.score) >= 5 ? "warn" : "accent"}>
              {item.score || "—"}
            </Badge>
          </div>
        )) : <div style={{ color: C.textMuted }}>No niches tracked yet.</div>}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Btn onClick={() => setTab("research")}>✦ AI Research</Btn>
        <Btn variant="ghost" onClick={() => setTab("niches")}>
          ◎ Add Niche
        </Btn>
        <Btn variant="ghost" onClick={() => setTab("briefs")}>
          ✎ New Brief
        </Btn>
        <Btn variant="ghost" onClick={() => setTab("seo")}>
          ¶ Generate SEO
        </Btn>
      </div>
    </div>
  );
}

// ─── DCEB SCORE DISPLAY ────────────────────────
function DCEBBar({ label, letter, value, reason }) {
  const pct = value * 10;
  const color = value >= 7 ? C.success : value >= 5 ? C.warn : C.danger;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: font, fontSize: 17, fontWeight: 800, color, width: 16 }}>{letter}</span>
          <span style={{ fontSize: 15, color: C.textDim, fontFamily: font }}>{label}</span>
        </div>
        <span style={{ fontFamily: font, fontSize: 19, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ background: C.surface, borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      {reason && <div style={{ fontSize: 17, color: C.textMuted, marginTop: 3, fontFamily: sansFont }}>{reason}</div>}
    </div>
  );
}

// ─── NICHES VIEW ───────────────────────────────
function NichesView({ data, addItem, deleteItem, updateItem, importItems, loading, setLoading, plan, usage, setUsage, openNicheHome }) {
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [dcebResult, setDcebResult] = useState(null);
  const [subNicheResults, setSubNicheResults] = useState(null);
  const limits = PLAN_LIMITS[plan];

  // Free plan cap check
  const atNicheCap = plan === "free" && data.niches.length >= limits.maxNiches;

  const handleAdd = () => {
    if (atNicheCap) { alert(`Free plan limit: ${limits.maxNiches} niches.`); return; }
    addItem("niches", {
      niche: niche.trim(),
      subNiche: subNiche.trim(),
      demand: "",
      competition: "",
      evergreen: "",
      brandability: "",
      score: "",
      status: "Researching",
      notes: "",
      date: todayISO(),
    });
    setNiche("");
    setSubNiche("");
  };

  const dcebScore = async () => {
    const target = subNiche ? `${niche} > ${subNiche}` : niche;
    if (!target.trim()) return;
    const allowed = await checkAndConsumeUsage("dceb", plan, usage, setUsage);
    if (!allowed) { alert(`DCEB limit reached (${limits.dceb}/day). Resets at midnight.`); return; }

    setLoading(true);
    setDcebResult(null);

    const res = await askClaudeJSON(
      `Analyze "${target}" as a Print on Demand t-shirt niche. Score each DCEB factor 1-10 with reasoning.

Return JSON: {
  "niche": "${niche}",
  "subNiche": "${subNiche || "General"}",
  "demand": 1-10,
  "demandReason": "one sentence why",
  "competition": 1-10,
  "competitionReason": "one sentence why",
  "evergreen": 1-10,
  "evergreenReason": "one sentence why",
  "brandability": 1-10,
  "brandabilityReason": "one sentence why",
  "summary": "2-3 sentence overall assessment",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"],
  "verdict": "Go|Maybe|Skip"
}`,
      "You are a POD niche analyst. DCEB = Demand, Competition, Evergreen, Brandability. Demand: search volume and audience size for t-shirt buyers. Competition: how saturated the niche is on Amazon Merch, Redbubble, Etsy. Evergreen: year-round vs seasonal appeal. Brandability: potential to build a recognizable sub-brand or product line. Be honest and specific.",
      "dceb"
    );

    setDcebResult(res);
    setLoading(false);
  };

  const exploreSubNiches = async () => {
    if (!niche.trim()) return;
    const allowed = await checkAndConsumeUsage("dceb", plan, usage, setUsage);
    if (!allowed) { alert(`DCEB limit reached (${limits.dceb}/day). Resets at midnight.`); return; }

    setLoading(true);
    setSubNicheResults(null);

    const res = await askClaudeJSON(
      `Research "${niche}" as a Print on Demand category. Return 5-6 sub-niches with DCEB scores.

Return JSON array: [{"subNiche":"...","demand":1-10,"demandReason":"short","competition":1-10,"competitionReason":"short","evergreen":1-10,"evergreenReason":"short","brandability":1-10,"brandabilityReason":"short","verdict":"Go|Maybe|Skip"}]`,
      "You are a POD niche analyst. Score honestly. Competition: high number = high competition = harder to sell.",
      "dceb"
    );

    setSubNicheResults(res);
    setLoading(false);
  };

  const addFromDCEB = (d) => {
    const score = ((d.demand + d.evergreen + d.brandability + (10 - d.competition)) / 4).toFixed(1);
    addItem("niches", {
      niche: d.niche || niche,
      subNiche: d.subNiche || subNiche || "General",
      demand: d.demand,
      competition: d.competition,
      evergreen: d.evergreen,
      brandability: d.brandability,
      score,
      status: "Researching",
      notes: d.summary || `D:${d.demand} C:${d.competition} E:${d.evergreen} B:${d.brandability} - ${d.verdict}`,
      date: todayISO(),
    });
  };

  const verdictColor = (v) => (v === "Go" ? "success" : v === "Maybe" ? "warn" : "danger");

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Niche Tracker</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Enter a niche → get DCEB scores from AI → add to tracker
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Input
            value={niche}
            onChange={setNiche}
            placeholder="Enter niche (e.g. Fishing, Nursing, Pickleball)"
            style={{ flex: 2, fontSize: 17, padding: "12px 16px" }}
          />
          <Input
            value={subNiche}
            onChange={setSubNiche}
            placeholder="Sub-niche (optional)"
            style={{ flex: 1, fontSize: 17, padding: "12px 16px" }}
          />
        </div>
        {atNicheCap && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: C.warnDim, borderRadius: 6, fontSize: 14, color: C.warn, fontFamily: font }}>
            ⚠ Free plan limit: {limits.maxNiches} niches. <a href="/pricing" style={{ color: C.accent }}>Upgrade</a> to add unlimited niches.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn onClick={handleAdd} disabled={atNicheCap || !niche.trim()} style={{ padding: "8px 16px", fontSize: 15 }}>
            + Add Niche
          </Btn>
          {limits.dceb > 0 ? (
            <Btn onClick={dcebScore} disabled={!niche.trim() || loading} style={{ padding: "10px 20px", fontSize: 19 }}>
              ✦ DCEB Auto-Score <UsageBadge used={usage.dceb || 0} limit={limits.dceb} />
            </Btn>
          ) : (
            <LockedBtn style={{ padding: "10px 20px", fontSize: 19 }}>DCEB Auto-Score</LockedBtn>
          )}
          {limits.dceb > 0 ? (
            <Btn
              variant="ghost"
              onClick={exploreSubNiches}
              disabled={!niche.trim() || loading}
              style={{ padding: "10px 20px", fontSize: 19 }}
            >
              ◎ Explore Sub-Niches
            </Btn>
          ) : (
            <LockedBtn style={{ padding: "10px 20px", fontSize: 19 }}>Explore Sub-Niches</LockedBtn>
          )}
          <CSVImportButton
            label="Import CSV"
            type="niches"
            existingRows={data.niches}
            onImport={(rows) => importItems("niches", rows)}
          />
          <CSVExportButton
            label="Export CSV"
            filename="podtracker-niches.csv"
            rows={data.niches}
            columns={["niche", "subNiche", "demand", "competition", "evergreen", "brandability", "score", "status", "notes", "date"]}
          />
          <CSVSampleButton
            label="Sample CSV"
            filename="podtracker-niches-sample.csv"
            columns={["niche", "subNiche", "demand", "competition", "evergreen", "brandability", "score", "status", "notes", "date"]}
            sampleRow={{
              niche: "Fishing",
              subNiche: "Bass Fishing",
              demand: 8,
              competition: 6,
              evergreen: 9,
              brandability: 7,
              score: 7.0,
              status: "Validated",
              notes: "Strong evergreen niche with gift potential",
              date: "2026-03-08",
            }}
          />
        </div>
      </div>

      {loading && <Loading />}

      {dcebResult && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontFamily: font,
                  color: C.accent,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                DCEB Analysis
              </div>
              <h2 style={{ fontSize: 23, fontWeight: 700, margin: 0, color: C.white }}>
                <NicheLink niche={dcebResult.niche} onOpen={openNicheHome} style={{ fontSize: 23, fontWeight: 700 }}>
                  {dcebResult.niche}
                </NicheLink>
                {dcebResult.subNiche && dcebResult.subNiche !== "General" ? (
                  <>
                    {" "}›{" "}
                    <NicheLink niche={dcebResult.niche} subNiche={dcebResult.subNiche} onOpen={openNicheHome} style={{ fontSize: 23, fontWeight: 700 }}>
                      {dcebResult.subNiche}
                    </NicheLink>
                  </>
                ) : ""}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge color={verdictColor(dcebResult.verdict)}>{dcebResult.verdict}</Badge>
              <div
                style={{
                  fontSize: 31,
                  fontWeight: 800,
                  fontFamily: font,
                  color:
                    (dcebResult.demand + dcebResult.evergreen + dcebResult.brandability + (10 - dcebResult.competition)) / 4 >= 7
                      ? C.success
                      : (dcebResult.demand + dcebResult.evergreen + dcebResult.brandability + (10 - dcebResult.competition)) / 4 >= 5
                        ? C.warn
                        : C.danger,
                }}
              >
                {((dcebResult.demand + dcebResult.evergreen + dcebResult.brandability + (10 - dcebResult.competition)) / 4).toFixed(1)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <DCEBBar label="Demand" letter="D" value={dcebResult.demand} reason={dcebResult.demandReason} />
              <DCEBBar label="Competition" letter="C" value={dcebResult.competition} reason={dcebResult.competitionReason} />
            </div>
            <div>
              <DCEBBar label="Evergreen" letter="E" value={dcebResult.evergreen} reason={dcebResult.evergreenReason} />
              <DCEBBar label="Brandability" letter="B" value={dcebResult.brandability} reason={dcebResult.brandabilityReason} />
            </div>
          </div>

          {dcebResult.summary && (
            <div
              style={{
                background: C.surface,
                borderRadius: 6,
                padding: 12,
                marginBottom: 16,
                borderLeft: `3px solid ${C.accent}`,
              }}
            >
              <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>{dcebResult.summary}</div>
            </div>
          )}

          {dcebResult.suggestedKeywords && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontFamily: font, color: C.textMuted, marginRight: 4 }}>Keywords:</span>
              {dcebResult.suggestedKeywords.map((k, i) => (
                <Badge key={i}>{k}</Badge>
              ))}
            </div>
          )}

          <Btn variant="success" onClick={() => addFromDCEB(dcebResult)}>
            + Add to Tracker
          </Btn>
        </div>
      )}

      {subNicheResults && Array.isArray(subNicheResults) && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <div
            style={{
              fontSize: 17,
              fontFamily: font,
              color: C.accent,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
            ◎ Sub-Niches for <NicheLink niche={niche} onOpen={openNicheHome}>&quot;{niche}&quot;</NicheLink>
          </div>
          {subNicheResults.map((n, i) => {
            const compositeScore = ((n.demand + n.evergreen + n.brandability + (10 - n.competition)) / 4).toFixed(1);
            return (
              <div
                key={i}
                style={{
                  padding: "16px 0",
                  borderBottom: i < subNicheResults.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <NicheLink niche={niche} subNiche={n.subNiche} onOpen={openNicheHome} style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>
                      {n.subNiche}
                    </NicheLink>
                    <Badge color={verdictColor(n.verdict)}>{n.verdict}</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontFamily: font,
                        fontSize: 21,
                        fontWeight: 800,
                        color: compositeScore >= 7 ? C.success : compositeScore >= 5 ? C.warn : C.danger,
                      }}
                    >
                      {compositeScore}
                    </span>
                    <Btn variant="success" onClick={() => addFromDCEB({ ...n, niche })} style={{ fontSize: 17, padding: "4px 10px" }}>
                      + Add
                    </Btn>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24, fontSize: 17, fontFamily: font }}>
                  <span style={{ color: C.textDim }}>
                    D:<span style={{ color: C.white, fontWeight: 700 }}>{n.demand}</span>
                  </span>
                  <span style={{ color: C.textDim }}>
                    C:<span style={{ color: C.white, fontWeight: 700 }}>{n.competition}</span>
                  </span>
                  <span style={{ color: C.textDim }}>
                    E:<span style={{ color: C.white, fontWeight: 700 }}>{n.evergreen}</span>
                  </span>
                  <span style={{ color: C.textDim }}>
                    B:<span style={{ color: C.white, fontWeight: 700 }}>{n.brandability}</span>
                  </span>
                </div>
                <div style={{ fontSize: 17, color: C.textMuted, marginTop: 4 }}>
                  {n.demandReason} · {n.competitionReason}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Table
        columns={[
          {
            key: "niche",
            label: "Niche",
            render: (v, row) => <NicheLink niche={row.niche} onOpen={openNicheHome}>{v}</NicheLink>,
          },
          {
            key: "subNiche",
            label: "Sub-Niche",
            render: (v, row) => <NicheLink niche={row.niche} subNiche={v} onOpen={openNicheHome}>{v || "General"}</NicheLink>,
          },
          {
            key: "score",
            label: "Score",
            render: (v) => <Badge color={v >= 7 ? "success" : v >= 5 ? "warn" : "danger"}>{v}</Badge>,
          },
          { key: "demand", label: "D" },
          { key: "competition", label: "C" },
          { key: "evergreen", label: "E" },
          { key: "brandability", label: "B" },
          {
            key: "status",
            label: "Status",
            filterable: true,
            render: (v) => <Badge color={v === "Validated" ? "success" : v === "Paused" ? "danger" : "accent"}>{v}</Badge>,
          },
          { key: "notes", label: "Notes", maxW: 250 },
          { key: "date", label: "Added" },
        ]}
        data={data.niches}
        exampleRow={EXAMPLE_ROWS.niches}
        onCreateExample={(item) => addItem("niches", item)}
        onUpdate={(i, item) => updateItem("niches", i, item)}
        onDelete={(i) => deleteItem("niches", i)}
      />
    </div>
  );
}

// ─── KEYWORDS VIEW ─────────────────────────────
function KeywordsView({ data, addItem, deleteItem, updateItem, importItems, loading, setLoading, plan, usage, setUsage, openNicheHome }) {
  const [form, setForm] = useState({
    keyword: "",
    niche: "",
    subNiche: "",
    volume: "Medium",
    competition: "Medium",
    platforms: [],
    status: "Active",
  });
  const [aiResult, setAiResult] = useState(null);
  const limits = PLAN_LIMITS[plan];
  const atKeywordCap = plan === "free" && data.keywords.length >= limits.maxKeywords;

  const handleAdd = () => {
    if (atKeywordCap) { alert(`Free plan limit: ${limits.maxKeywords} keywords.`); return; }
    addItem("keywords", {
      ...form,
      keyword: form.keyword.trim(),
      niche: form.niche.trim(),
      subNiche: form.subNiche.trim(),
      platforms: Array.isArray(form.platforms) ? form.platforms.join(", ") : form.platforms,
      date: todayISO(),
    });
    setForm({
      keyword: "",
      niche: "",
      subNiche: "",
      volume: "Medium",
      competition: "Medium",
      platforms: [],
      status: "Active",
    });
  };

  const aiResearch = async () => {
    const niche = form.niche || form.keyword;
    if (!niche) return;
    const allowed = await checkAndConsumeUsage("keywordAI", plan, usage, setUsage);
    if (!allowed) { alert(`AI Keyword Research limit reached (${limits.keywordAI}/day). Resets at midnight.`); return; }

    setLoading(true);
    const res = await askClaudeJSON(
      `Research keywords for the "${niche}" Print on Demand niche. Return a JSON array of 8-10 keywords. Each: {"keyword":"...","volume":"Low|Medium|High","competition":"Low|Medium|High","platforms":"Amazon Merch, Etsy, Redbubble","notes":"one sentence"}`,
      "You are a POD keyword research expert.",
      "keywordAI"
    );
    setAiResult(res);
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Keyword Research</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Track keywords by niche with volume and competition data
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Input value={form.keyword} onChange={(v) => setForm((p) => ({ ...p, keyword: v }))} placeholder="Keyword" />
          <Input value={form.niche} onChange={(v) => setForm((p) => ({ ...p, niche: v }))} placeholder="Niche" />
          <Select
            value={form.volume}
            onChange={(v) => setForm((p) => ({ ...p, volume: v }))}
            options={["Low", "Medium", "High"]}
            placeholder="Volume"
          />
          <Select
            value={form.competition}
            onChange={(v) => setForm((p) => ({ ...p, competition: v }))}
            options={COMPETITION}
            placeholder="Competition"
          />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn onClick={handleAdd} disabled={atKeywordCap}>+ Add Keyword</Btn>
          {limits.keywordAI > 0 ? (
            <Btn variant="ghost" onClick={aiResearch} disabled={(!form.niche && !form.keyword) || loading}>
              ✦ AI Keyword Research <UsageBadge used={usage.keywordAI || 0} limit={limits.keywordAI} />
            </Btn>
          ) : (
            <LockedBtn>AI Keyword Research</LockedBtn>
          )}
          <CSVImportButton
            label="Import CSV"
            type="keywords"
            existingRows={data.keywords}
            onImport={(rows) => importItems("keywords", rows)}
          />
          <CSVExportButton
            label="Export CSV"
            filename="podtracker-keywords.csv"
            rows={data.keywords}
            columns={["keyword", "niche", "subNiche", "volume", "competition", "platforms", "status", "notes", "date"]}
          />
          <CSVSampleButton
            label="Sample CSV"
            filename="podtracker-keywords-sample.csv"
            columns={["keyword", "niche", "subNiche", "volume", "competition", "platforms", "status", "notes", "date"]}
            sampleRow={{
              keyword: "bass fishing shirt",
              niche: "Fishing",
              subNiche: "Bass Fishing",
              volume: "High",
              competition: "Medium",
              platforms: "Amazon Merch, Etsy",
              status: "Active",
              notes: "Strong buyer intent phrase",
              date: "2026-03-08",
            }}
          />
        </div>
      </div>

      {loading && <Loading />}

      {aiResult && Array.isArray(aiResult) && (
        <div
          style={{
            background: C.accentGlow,
            border: `1px solid ${C.accentDim}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontFamily: font,
              color: C.accent,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            ✦ AI Keyword Results
          </div>

          {aiResult.map((k, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: i < aiResult.length - 1 ? `1px solid ${C.accentDim}` : "none",
              }}
            >
              <div>
                <span style={{ color: C.white, fontWeight: 600 }}>{k.keyword}</span>
                <span style={{ color: C.textDim, fontSize: 17, marginLeft: 12 }}>
                  Vol: {k.volume} · Comp: {k.competition}
                </span>
                {k.notes && <div style={{ color: C.textMuted, fontSize: 15, marginTop: 4 }}>{k.notes}</div>}
              </div>

              <Btn
                variant="success"
                onClick={() =>
                  addItem("keywords", {
                    ...k,
                    niche: form.niche || form.keyword,
                    date: todayISO(),
                    status: "Active",
                  })
                }
                style={{ fontSize: 17, padding: "4px 10px" }}
              >
                + Add
              </Btn>
            </div>
          ))}
        </div>
      )}

      <Table
        columns={[
          { key: "keyword", label: "Keyword" },
          {
            key: "niche",
            label: "Niche",
            render: (v, row) => <NicheLink niche={row.niche} subNiche={row.subNiche} onOpen={openNicheHome}>{v}</NicheLink>,
          },
          {
            key: "volume",
            label: "Volume",
            filterable: true,
            render: (v) => <Badge color={v === "High" ? "success" : v === "Medium" ? "warn" : "danger"}>{v}</Badge>,
          },
          { key: "competition", label: "Competition", filterable: true },
          { key: "platforms", label: "Platforms", maxW: 200, filterable: true },
          { key: "status", label: "Status", filterable: true },
          { key: "date", label: "Added" },
        ]}
        data={data.keywords}
        exampleRow={EXAMPLE_ROWS.keywords}
        onCreateExample={(item) => addItem("keywords", item)}
        onUpdate={(i, item) => updateItem("keywords", i, item)}
        onDelete={(i) => deleteItem("keywords", i)}
      />
    </div>
  );
}

// ─── TRENDS VIEW ───────────────────────────────
function TrendsView({ data, addItem, deleteItem, updateItem, importItems, loading, setLoading, plan, usage, setUsage }) {
  const [form, setForm] = useState({
    trend: "",
    source: "",
    category: "",
    seasonality: "Evergreen",
    peakMonths: "",
    score: 5,
    notes: "",
  });
  const [aiResult, setAiResult] = useState(null);
  const limits = PLAN_LIMITS[plan];

  const handleAdd = () => {
    addItem("trends", { ...form, trend: form.trend.trim(), source: form.source.trim(), category: form.category.trim(), peakMonths: form.peakMonths.trim(), notes: form.notes.trim(), date: todayISO() });
    setForm({
      trend: "",
      source: "",
      category: "",
      seasonality: "Evergreen",
      peakMonths: "",
      score: 5,
      notes: "",
    });
  };

  const aiScan = async () => {
    const allowed = await checkAndConsumeUsage("trendScan", plan, usage, setUsage);
    if (!allowed) { alert(`AI Trend Scan limit reached (${limits.trendScan}/day). Resets at midnight.`); return; }
    setLoading(true);
    const res = await askClaudeJSON(
      `What are 5-8 current trending topics for Print on Demand t-shirts in March 2026? Consider hobbies, occupations, memes, seasonal, lifestyle. Return JSON array: {"trend":"...","source":"Google Trends|Pinterest|Etsy|General","category":"Hobby|Occupation|Lifestyle|Seasonal|Meme","seasonality":"Evergreen|Seasonal","peakMonths":"e.g. Mar-Jun","score":1-10,"notes":"one sentence"}`,
      "You are a POD trend analyst.",
      "trendScan"
    );
    setAiResult(res);
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Trend Log</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Track trending topics and seasonal patterns
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Input value={form.trend} onChange={(v) => setForm((p) => ({ ...p, trend: v }))} placeholder="Trend name" />
          <Input value={form.source} onChange={(v) => setForm((p) => ({ ...p, source: v }))} placeholder="Source" />
          <Select
            value={form.category}
            onChange={(v) => setForm((p) => ({ ...p, category: v }))}
            options={["Hobby", "Occupation", "Lifestyle", "Seasonal", "Meme", "Pop Culture"]}
            placeholder="Category"
          />
          <Select
            value={form.seasonality}
            onChange={(v) => setForm((p) => ({ ...p, seasonality: v }))}
            options={["Evergreen", "Seasonal"]}
          />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontFamily: font, color: C.textDim }}>
            Score:{" "}
            <input
              type="range"
              min="1"
              max="10"
              value={form.score}
              onChange={(e) => setForm((p) => ({ ...p, score: parseInt(e.target.value, 10) }))}
              style={{ width: 100 }}
            />
            <span style={{ color: C.accent, fontWeight: 700 }}>{form.score}</span>
          </label>
          <Btn onClick={handleAdd}>+ Add Trend</Btn>
          {limits.trendScan > 0 ? (
            <Btn variant="ghost" onClick={aiScan} disabled={loading}>
              ✦ AI Trend Scan <UsageBadge used={usage.trendScan || 0} limit={limits.trendScan} />
            </Btn>
          ) : (
            <LockedBtn tooltip="Upgrade to Business to unlock AI Trend Scan.">AI Trend Scan</LockedBtn>
          )}
          <CSVImportButton
            label="Import CSV"
            type="trends"
            existingRows={data.trends}
            onImport={(rows) => importItems("trends", rows)}
          />
          <CSVExportButton
            label="Export CSV"
            filename="podtracker-trends.csv"
            rows={data.trends}
            columns={["trend", "source", "category", "seasonality", "peakMonths", "score", "notes", "date"]}
          />
          <CSVSampleButton
            label="Sample CSV"
            filename="podtracker-trends-sample.csv"
            columns={["trend", "source", "category", "seasonality", "peakMonths", "score", "notes", "date"]}
            sampleRow={{
              trend: "Retro Camping",
              source: "Pinterest",
              category: "Lifestyle",
              seasonality: "Evergreen",
              peakMonths: "Mar-Jun",
              score: 8,
              notes: "Strong visual trend with broad design flexibility",
              date: "2026-03-08",
            }}
          />
        </div>
      </div>

      {loading && <Loading />}

      {aiResult && Array.isArray(aiResult) && (
        <div
          style={{
            background: C.accentGlow,
            border: `1px solid ${C.accentDim}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontFamily: font,
              color: C.accent,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            ✦ AI Trend Scan Results
          </div>
          {aiResult.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: `1px solid ${C.accentDim}`,
              }}
            >
              <div>
                <span style={{ color: C.white, fontWeight: 600 }}>{t.trend}</span>
                <span style={{ color: C.textDim, fontSize: 17, marginLeft: 8 }}>
                  {t.category} · {t.seasonality}
                  {t.peakMonths ? ` · ${t.peakMonths}` : ""}
                </span>
                <div style={{ color: C.textMuted, fontSize: 17 }}>{t.notes}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge color={t.score >= 7 ? "success" : t.score >= 5 ? "warn" : "danger"}>{t.score + " of 10"}</Badge>
                <Btn variant="success" onClick={() => addItem("trends", { ...t, date: todayISO() })} style={{ fontSize: 17, padding: "4px 10px" }}>
                  + Add
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Table
        columns={[
          { key: "trend", label: "Trend" },
          { key: "source", label: "Source", filterable: true },
          { key: "category", label: "Category", filterable: true },
          { key: "seasonality", label: "Season", filterable: true },
          { key: "peakMonths", label: "Peak" },
          {
            key: "score",
            label: "Score",
            minW: 96,
            render: (v) => <Badge color={v >= 7 ? "success" : v >= 5 ? "warn" : "danger"}>{v + " of 10"}</Badge>,
          },
          { key: "notes", label: "Notes", maxW: 250 },
          { key: "date", label: "Spotted" },
        ]}
        data={data.trends}
        exampleRow={EXAMPLE_ROWS.trends}
        onCreateExample={(item) => addItem("trends", item)}
        onUpdate={(i, item) => updateItem("trends", i, item)}
        onDelete={(i) => deleteItem("trends", i)}
      />
    </div>
  );
}

// ─── DESIGN BRIEFS VIEW ────────────────────────
function BriefsView({ data, addItem, deleteItem, updateItem, loading, setLoading, plan, usage, setUsage, openNicheHome }) {
  const [form, setForm] = useState({
    niche: "",
    subNiche: "",
    concept: "",
    style: "",
    slogan: "",
    platform: "Amazon Merch",
    status: "Draft",
  });
  const [aiResult, setAiResult] = useState(null);
  const limits = PLAN_LIMITS[plan];

  const handleAdd = () => {
    const id = `DB-${String(data.briefs.length + 1).padStart(3, "0")}`;
    addItem("briefs", {
      ...form,
      niche: form.niche.trim(),
      subNiche: form.subNiche.trim(),
      concept: form.concept.trim(),
      style: form.style.trim(),
      slogan: form.slogan.trim(),
      id,
      date: todayISO(),
    });
    setForm({
      niche: "",
      subNiche: "",
      concept: "",
      style: "",
      slogan: "",
      platform: "Amazon Merch",
      status: "Draft",
    });
  };

  const aiGenerate = async () => {
    if (!form.niche) return;
    const allowed = await checkAndConsumeUsage("briefs", plan, usage, setUsage);
    if (!allowed) {
      if (limits.briefs === 0) { alert("AI Design Briefs require the Business plan."); }
      else { alert(`Design Brief limit reached (${limits.briefs}/day). Resets at midnight.`); }
      return;
    }
    setLoading(true);
    const keyword = form.slogan || form.subNiche || form.niche;
    const res = await askClaudeJSON(
      `Generate 4 design concept briefs for "${form.niche}" (sub-niche: "${form.subNiche || "general"}") with keyword/theme "${keyword}". Return JSON array: {"concept":"2-3 sentence description","style":"e.g. Minimalist, Vintage, Bold Typography, Illustrative, Retro","slogan":"copyright-free slogan","platform":"best platform for this design","notes":"one tip"}`,
      "You are a POD design concept expert. Generate only copyright-free, original concepts.",
      "briefs"
    );
    setAiResult(res);
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Design Briefs</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Create and manage design concept briefs
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Input value={form.niche} onChange={(v) => setForm((p) => ({ ...p, niche: v }))} placeholder="Niche" />
          <Input value={form.subNiche} onChange={(v) => setForm((p) => ({ ...p, subNiche: v }))} placeholder="Sub-niche" />
          <Input value={form.slogan} onChange={(v) => setForm((p) => ({ ...p, slogan: v }))} placeholder="Slogan / keyword" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Input value={form.concept} onChange={(v) => setForm((p) => ({ ...p, concept: v }))} placeholder="Concept description" />
          <Input value={form.style} onChange={(v) => setForm((p) => ({ ...p, style: v }))} placeholder="Style direction" />
          <Select value={form.platform} onChange={(v) => setForm((p) => ({ ...p, platform: v }))} options={PLATFORMS} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn onClick={handleAdd}>+ Add Brief</Btn>
          {limits.briefs > 0 ? (
            <Btn variant="ghost" onClick={aiGenerate} disabled={!form.niche || loading}>
              ✦ AI Generate Briefs <UsageBadge used={usage.briefs || 0} limit={limits.briefs} />
            </Btn>
          ) : (
            <LockedBtn tooltip="Upgrade to Business to unlock AI Design Briefs.">AI Generate Briefs</LockedBtn>
          )}
        </div>
      </div>

      {loading && <Loading />}

      {aiResult && Array.isArray(aiResult) && (
        <div
          style={{
            background: C.accentGlow,
            border: `1px solid ${C.accentDim}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontFamily: font,
              color: C.accent,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            ✦ AI Generated Briefs
          </div>
          {aiResult.map((b, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${C.accentDim}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: C.accent, fontSize: 15, fontFamily: font }}>
                  {b.style} · {b.platform}
                </span>
                <Btn
                  variant="success"
                  onClick={() => {
                    const id = `DB-${String(data.briefs.length + 1).padStart(3, "0")}`;
                    addItem("briefs", {
                      id,
                      niche: form.niche,
                      subNiche: form.subNiche,
                      concept: b.concept,
                      style: b.style,
                      slogan: b.slogan,
                      platform: b.platform,
                      status: "Draft",
                      date: todayISO(),
                    });
                  }}
                  style={{ fontSize: 17, padding: "4px 10px" }}
                >
                  + Add
                </Btn>
              </div>
              <div style={{ color: C.white, fontSize: 19, fontWeight: 600, marginBottom: 4 }}>&quot;{b.slogan}&quot;</div>
              <div style={{ color: C.textDim, fontSize: 15 }}>{b.concept}</div>
            </div>
          ))}
        </div>
      )}

      <Table
        columns={[
          { key: "id", label: "ID" },
          {
            key: "niche",
            label: "Niche",
            render: (v, row) => <NicheLink niche={row.niche} subNiche={row.subNiche} onOpen={openNicheHome}>{v}</NicheLink>,
          },
          { key: "slogan", label: "Slogan" },
          { key: "style", label: "Style" },
          { key: "platform", label: "Platform", filterable: true },
          {
            key: "status",
            label: "Status",
            filterable: true,
            render: (v) => <Badge color={v === "Ready" ? "success" : v === "Rejected" ? "danger" : "accent"}>{v}</Badge>,
          },
          { key: "concept", label: "Concept", maxW: 300 },
          { key: "date", label: "Created" },
        ]}
        data={data.briefs}
        exampleRow={EXAMPLE_ROWS.briefs}
        onCreateExample={(item) => addItem("briefs", item)}
        onUpdate={(i, item) => updateItem("briefs", i, item)}
        onDelete={(i) => deleteItem("briefs", i)}
      />
    </div>
  );
}

// ─── SEO VIEW ──────────────────────────────────
function SEOView({ data, addItem, deleteItem, updateItem, loading, setLoading, plan, usage, setUsage, openNicheHome }) {
  const [designId, setDesignId] = useState("");
  const [platform, setPlatform] = useState("Amazon Merch");
  const [generated, setGenerated] = useState(null);
  const limits = PLAN_LIMITS[plan];

  const brief = data.briefs.find((b) => b.id === designId);
  const lims = PLATFORM_LIMITS[platform];

  const generate = async () => {
    if (!brief) return;
    const allowed = await checkAndConsumeUsage("seo", plan, usage, setUsage);
    if (!allowed) { alert(`SEO Copy limit reached (${limits.seo}/day). Resets at midnight.`); return; }

    setLoading(true);
    const prompt =
      platform === "Amazon Merch"
        ? `Generate Amazon Merch SEO listing for a "${brief.niche}" t-shirt. Design: "${brief.concept}". Slogan: "${brief.slogan}". Return JSON: {"title":"max 60 chars, front-load keyword","bullet1":"max 256 chars, benefit-driven","bullet2":"max 256 chars, gift angle","description":"max 2000 chars, story-telling format: Hook > Body > Features > CTA","tags":"comma-separated keywords"}`
        : platform === "Etsy"
          ? `Generate Etsy SEO listing for a "${brief.niche}" t-shirt. Design: "${brief.concept}". Slogan: "${brief.slogan}". Return JSON: {"title":"max 140 chars, front-load keywords, use pipes","bullet1":"","bullet2":"","description":"first 160 chars are search preview, then storytelling","tags":"exactly 13 comma-separated multi-word tags"}`
          : platform === "Redbubble"
            ? `Generate Redbubble SEO listing for a "${brief.niche}" t-shirt. Design: "${brief.concept}". Slogan: "${brief.slogan}". Return JSON: {"title":"max 100 chars","bullet1":"","bullet2":"","description":"searchable and personality-driven","tags":"up to 15 comma-separated tags, mix broad and specific"}`
            : `Generate TeeSpring SEO listing for a "${brief.niche}" t-shirt. Design: "${brief.concept}". Slogan: "${brief.slogan}". Return JSON: {"title":"clear and descriptive","bullet1":"","bullet2":"","description":"conversational, audience identity focused","tags":"comma-separated tags"}`;

    const res = await askClaudeJSON(
      prompt,
      "You are a POD SEO copywriting expert. Write compelling, keyword-rich copy.",
      "seo"
    );
    setGenerated(res);
    setLoading(false);
  };

  const saveGenerated = () => {
    if (!generated) return;
    addItem("seo", { designId, platform, ...generated, date: todayISO() });
    setGenerated(null);
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>SEO Copy Generator</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Generate platform-optimized titles, bullets, and descriptions
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <Select
            value={designId}
            onChange={setDesignId}
            options={data.briefs.map((b) => b.id)}
            placeholder="Select Design Brief"
            style={{ width: 200 }}
          />
          <Select value={platform} onChange={setPlatform} options={PLATFORMS} style={{ width: 200 }} />
          {limits.seo > 0 ? (
            <Btn onClick={generate} disabled={!designId || loading}>
              ✦ Generate SEO Copy <UsageBadge used={usage.seo || 0} limit={limits.seo} />
            </Btn>
          ) : (
            <LockedBtn>Generate SEO Copy</LockedBtn>
          )}
        </div>
        {brief && (
          <div style={{ fontSize: 15, color: C.textDim, fontFamily: font }}>
            {brief.id}: &quot;{brief.slogan}&quot; · <NicheLink niche={brief.niche} subNiche={brief.subNiche} onOpen={openNicheHome}>{brief.niche}</NicheLink> · {brief.style}
          </div>
        )}
      </div>

      {loading && <Loading />}

      {generated && (
        <div
          style={{
            background: C.accentGlow,
            border: `1px solid ${C.accentDim}`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span
              style={{
                fontSize: 15,
                fontFamily: font,
                color: C.accent,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              ✦ Generated for {platform}
            </span>
            <Btn variant="success" onClick={saveGenerated}>
              Save to Templates
            </Btn>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 19, fontFamily: font, color: C.textMuted, textTransform: "uppercase" }}>
              Title {lims.title ? "(" + (generated.title?.length || 0) + " of " + lims.title + ")" : ""}
            </label>
            <div
              style={{
                color: C.white,
                fontSize: 17,
                fontWeight: 600,
                marginTop: 4,
                padding: "8px 12px",
                background: C.surface,
                borderRadius: 6,
                border: `1px solid ${
                  (generated.title?.length || 0) > lims.title && lims.title ? C.danger : C.border
                }`,
              }}
            >
              {generated.title}
            </div>
          </div>
          {generated.bullet1 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 19, fontFamily: font, color: C.textMuted, textTransform: "uppercase" }}>
                Bullet 1 {lims.bullet ? "(" + (generated.bullet1?.length || 0) + " of " + lims.bullet + ")" : ""}
              </label>
              <div
                style={{
                  color: C.text,
                  fontSize: 15,
                  marginTop: 4,
                  padding: "8px 12px",
                  background: C.surface,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                }}
              >
                {generated.bullet1}
              </div>
            </div>
          )}
          {generated.bullet2 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 19, fontFamily: font, color: C.textMuted, textTransform: "uppercase" }}>
                Bullet 2 {lims.bullet ? "(" + (generated.bullet2?.length || 0) + " of " + lims.bullet + ")" : ""}
              </label>
              <div
                style={{
                  color: C.text,
                  fontSize: 15,
                  marginTop: 4,
                  padding: "8px 12px",
                  background: C.surface,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                }}
              >
                {generated.bullet2}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 19, fontFamily: font, color: C.textMuted, textTransform: "uppercase" }}>
              Description {lims.desc ? "(" + (generated.description?.length || 0) + " of " + lims.desc + ")" : ""}
            </label>
            <div
              style={{
                color: C.text,
                fontSize: 15,
                marginTop: 4,
                padding: "8px 12px",
                background: C.surface,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                whiteSpace: "pre-wrap",
              }}
            >
              {generated.description}
            </div>
          </div>
          {generated.tags && (
            <div>
              <label style={{ fontSize: 19, fontFamily: font, color: C.textMuted, textTransform: "uppercase" }}>Tags</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {generated.tags.split(",").map((t, i) => (
                  <Badge key={i}>{t.trim()}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Table
        columns={[
          { key: "designId", label: "Brief" },
          { key: "platform", label: "Platform", filterable: true },
          { key: "title", label: "Title", maxW: 250 },
          { key: "bullet1", label: "Bullet 1", maxW: 200 },
          { key: "description", label: "Description", maxW: 200 },
          { key: "date", label: "Created" },
        ]}
        data={data.seo}
        exampleRow={EXAMPLE_ROWS.seo}
        onCreateExample={(item) => addItem("seo", item)}
        onUpdate={(i, item) => updateItem("seo", i, item)}
        onDelete={(i) => deleteItem("seo", i)}
      />
    </div>
  );
}

// ─── INVENTORY VIEW ────────────────────────────
function InventoryView({ data, addItem, deleteItem, updateItem, importItems, plan }) {
  const [form, setForm] = useState({
    sku: "",
    design: "",
    briefId: "",
    platform: "Amazon Merch",
    url: "",
    imageUrl: "",
    status: "Active",
    notes: "",
  });
  const limits = PLAN_LIMITS[plan];
  const atCap = plan === "free" && data.inventory.length >= limits.maxInventory;

  const handleAdd = () => {
    if (atCap) { alert(`Free plan limit: ${limits.maxInventory} inventory items. Upgrade for unlimited.`); return; }
    addItem("inventory", {
      ...form,
      sku: form.sku.trim(),
      design: form.design.trim(),
      briefId: form.briefId.trim(),
      url: form.url.trim(),
      imageUrl: form.imageUrl.trim(),
      notes: form.notes.trim(),
      dateListed: todayISO(),
      sales: 0,
    });
    setForm({
      sku: "",
      design: "",
      briefId: "",
      platform: "Amazon Merch",
      url: "",
      imageUrl: "",
      status: "Active",
      notes: "",
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Listings Tracker</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Track live listings across all platforms
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Input value={form.sku} onChange={(v) => setForm((p) => ({ ...p, sku: v }))} placeholder="SKU (e.g. POD-001)" />
          <Input value={form.design} onChange={(v) => setForm((p) => ({ ...p, design: v }))} placeholder="Design name" />
          <Select value={form.platform} onChange={(v) => setForm((p) => ({ ...p, platform: v }))} options={PLATFORMS} />
          <Select value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={LISTING_STATUS} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12, marginBottom: 12 }}>
          <Input value={form.url} onChange={(v) => setForm((p) => ({ ...p, url: v }))} placeholder="Listing URL" />
          <Input value={form.imageUrl} onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))} placeholder="Image URL" />
          <Input value={form.notes} onChange={(v) => setForm((p) => ({ ...p, notes: v }))} placeholder="Notes" />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn onClick={handleAdd} disabled={atCap}>+ Add Listing</Btn>
          <CSVImportButton
            label="Import CSV"
            type="inventory"
            existingRows={data.inventory}
            onImport={(rows) => importItems("inventory", rows)}
          />
          <CSVExportButton
            label="Export CSV"
            filename="podtracker-listings.csv"
            rows={data.inventory}
            columns={["sku", "design", "briefId", "platform", "url", "imageUrl", "status", "notes", "dateListed", "sales"]}
          />
          <CSVSampleButton
            label="Sample CSV"
            filename="podtracker-listings-sample.csv"
            columns={["sku", "design", "briefId", "platform", "url", "imageUrl", "status", "notes", "dateListed", "sales"]}
            sampleRow={{
              sku: "POD-001",
              design: "Bass Legend",
              briefId: "DB-001",
              platform: "Amazon Merch",
              url: "https://example.com/listing",
              imageUrl: "https://images.example.com/bass-legend.jpg",
              status: "Active",
              notes: "First upload",
              dateListed: "2026-03-08",
              sales: 3,
            }}
          />
        </div>
      </div>

      <Table
        columns={[
          { key: "sku", label: "SKU" },
          { key: "design", label: "Design" },
          {
            key: "imageUrl",
            label: "Image",
            render: (v, row) => <ListingImagePreview src={v} alt={row.design || row.sku || "Listing image"} />,
          },
          { key: "platform", label: "Platform", filterable: true },
          {
            key: "status",
            label: "Status",
            filterable: true,
            render: (v) => <Badge color={v === "Active" ? "success" : v === "Flagged" ? "danger" : "warn"}>{v}</Badge>,
          },
          { key: "sales", label: "Sales" },
          {
            key: "url",
            label: "URL",
            maxW: 200,
            render: (v) =>
              v ? (
                <a href={v} target="_blank" rel="noopener" style={{ color: C.accent, fontSize: 15 }}>
                  View
                </a>
              ) : (
                "—"
              ),
          },
          { key: "dateListed", label: "Listed" },
          { key: "notes", label: "Notes", maxW: 200 },
        ]}
        data={data.inventory}
        exampleRow={EXAMPLE_ROWS.inventory}
        onCreateExample={(item) => addItem("inventory", item)}
        onUpdate={(i, item) => updateItem("inventory", i, item)}
        onDelete={(i) => deleteItem("inventory", i)}
      />
    </div>
  );
}

// ─── TRADEMARK CHECK VIEW ──────────────────────
function TrademarkView({ loading, setLoading, plan, usage, setUsage }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const limits = PLAN_LIMITS[plan];

  const checkTrademark = async () => {
    if (!query.trim()) return;
    const allowed = await checkAndConsumeUsage("trademark", plan, usage, setUsage);
    if (!allowed) { alert(`Trademark Check limit reached (${limits.trademark}/day). Resets at midnight.`); return; }

    setLoading(true);
    setResults(null);

    const aiResult = await askClaudeJSON(
      `Analyze "${query}" for trademark risk in the Print on Demand t-shirt space. Consider: 1) Is this a commonly trademarked phrase, brand name, or slogan? 2) Are there well-known brands, sports teams, TV shows, movies, or celebrities this could conflict with? 3) Is this a generic or descriptive term that is likely safe? 4) Any known POD-specific trademark traps? Return JSON with these fields: phrase, riskLevel, riskScore, reasoning, knownConflicts, suggestions, categories, recommendation.`,
      "You are a trademark risk analyst specializing in Print on Demand merchandise. Be thorough and cautious. Always recommend checking USPTO TESS for confirmation. Respond ONLY with valid JSON.",
      "trademark"
    );

    setResults(aiResult);
    if (aiResult) {
      setHistory((prev) => [{ query, result: aiResult, time: new Date().toLocaleString() }, ...prev.slice(0, 19)]);
    }
    setLoading(false);
  };

  const riskColor = (level) => {
    if (level === "Low") return "success";
    if (level === "Medium") return "warn";
    return "danger";
  };

  const riskBarColor = (score) => {
    if (score <= 3) return C.success;
    if (score <= 6) return C.warn;
    return C.danger;
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Trademark Check</h1>
      <p style={{ color: C.textDim, fontSize: 16, margin: "0 0 24px", fontFamily: font }}>
        Check phrases, slogans, and niche terms for trademark risk before listing
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <Input
            value={query}
            onChange={setQuery}
            placeholder='Enter a phrase, slogan, or brand name (e.g. "Reel Therapy", "Girl Dad", "Mama Bear")'
            style={{ flex: 1, fontSize: 17, padding: "12px 16px" }}
          />
          {limits.trademark > 0 ? (
            <Btn onClick={checkTrademark} disabled={!query.trim() || loading} style={{ padding: "12px 24px", fontSize: 16 }}>
              ™ Check <UsageBadge used={usage.trademark || 0} limit={limits.trademark} />
            </Btn>
          ) : (
            <LockedBtn style={{ padding: "12px 24px", fontSize: 16 }}>™ Check</LockedBtn>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="ghost" onClick={() => setQuery("Mama Bear")} style={{ fontSize: 14 }}>
            Mama Bear
          </Btn>
          <Btn variant="ghost" onClick={() => setQuery("Girl Dad")} style={{ fontSize: 14 }}>
            Girl Dad
          </Btn>
          <Btn variant="ghost" onClick={() => setQuery("Reel Therapy")} style={{ fontSize: 14 }}>
            Reel Therapy
          </Btn>
          <Btn variant="ghost" onClick={() => setQuery("Plant Mom")} style={{ fontSize: 14 }}>
            Plant Mom
          </Btn>
        </div>
      </div>

      {loading && <Loading />}

      {results && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: font,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Trademark Analysis
              </div>
              <h2 style={{ fontSize: 23, fontWeight: 700, margin: 0, color: C.white }}>&quot;{results.phrase}&quot;</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge color={riskColor(results.riskLevel)}>{results.riskLevel} Risk</Badge>
              <div style={{ fontSize: 31, fontWeight: 800, fontFamily: font, color: riskBarColor(results.riskScore) }}>
                {results.riskScore + " of 10"}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontFamily: font, color: C.textDim }}>Risk Level</span>
              <span style={{ fontSize: 14, fontFamily: font, color: riskBarColor(results.riskScore), fontWeight: 700 }}>
                {results.riskScore + " of 10"}
              </span>
            </div>
            <div style={{ background: C.surface, borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div
                style={{
                  width: results.riskScore * 10 + "%",
                  height: "100%",
                  background: riskBarColor(results.riskScore),
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: C.surface,
              borderRadius: 6,
              padding: 14,
              marginBottom: 16,
              borderLeft: `3px solid ${riskBarColor(results.riskScore)}`,
            }}
          >
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.7 }}>{results.reasoning}</div>
          </div>

          <div
            style={{
              background: results.riskScore <= 3 ? C.successDim : results.riskScore <= 6 ? C.warnDim : C.dangerDim,
              borderRadius: 6,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontFamily: font,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Recommendation
            </div>
            <div style={{ fontSize: 16, color: C.white, fontWeight: 600 }}>{results.recommendation}</div>
          </div>

          {results.knownConflicts && results.knownConflicts.length > 0 && results.knownConflicts[0] !== "" && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: font,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Potential Conflicts
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {results.knownConflicts.map((c, i) => (
                  <Badge key={i} color="danger">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {results.suggestions && results.suggestions.length > 0 && results.suggestions[0] !== "" && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: font,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Safer Alternatives
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {results.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(s)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 14,
                      fontFamily: font,
                      background: C.accentDim,
                      color: C.accent,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.categories && results.categories.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: font,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Relevant Trademark Classes
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {results.categories.map((c, i) => (
                  <Badge key={i}>{c}</Badge>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: C.accentGlow,
              border: `1px solid ${C.accentDim}`,
              borderRadius: 6,
              padding: 14,
              marginTop: 16,
            }}
          >
            <div style={{ fontSize: 14, fontFamily: font, color: C.accent, marginBottom: 6, fontWeight: 600 }}>
              Always verify on USPTO TESS
            </div>
            <div style={{ fontSize: 14, color: C.textDim, marginBottom: 8 }}>
              AI analysis is a starting point, not legal advice. Always confirm with the official trademark database before listing.
            </div>
            <div style={{ fontSize: 14, fontFamily: font, color: C.accent, wordBreak: "break-all" }}>
              https://tmsearch.uspto.gov - Search for &quot;{results.phrase}&quot; in the free-form search
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 16,
              fontFamily: font,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Check History
          </h3>
          <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${C.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 15 }}>
              <thead>
                <tr>
                  {["Phrase", "Risk", "Score", "Recommendation", "Checked"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        background: C.surface,
                        color: C.textMuted,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontSize: 13,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? C.card : "transparent", cursor: "pointer" }}
                    onClick={() => {
                      setQuery(h.query);
                      setResults(h.result);
                    }}
                  >
                    <td style={{ padding: "8px 12px", color: C.white, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>
                      {h.query}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
                      <Badge color={riskColor(h.result.riskLevel)}>{h.result.riskLevel}</Badge>
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        color: riskBarColor(h.result.riskScore),
                        fontWeight: 700,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {h.result.riskScore + " of 10"}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        color: C.textDim,
                        borderBottom: `1px solid ${C.border}`,
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.result.recommendation}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        color: C.textMuted,
                        borderBottom: `1px solid ${C.border}`,
                        fontSize: 13,
                      }}
                    >
                      {h.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 8, fontStyle: "italic" }}>
            Click any row to view the full analysis again
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI RESEARCH VIEW ──────────────────────────
function ResearchView({ data, loading, setLoading, plan, usage, setUsage }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const limits = PLAN_LIMITS[plan];

  const research = async () => {
    if (!query.trim()) return;
    const allowed = await checkAndConsumeUsage("research", plan, usage, setUsage);
    if (!allowed) { alert(`AI Research limit reached (${limits.research}/day). Resets at midnight.`); return; }

    setLoading(true);
    setResult("");
    const r = await askClaude(
      query,
      `You are a Print on Demand business expert. The user is researching niches, keywords, trends, and designs for POD across Amazon Merch, Redbubble, Etsy, and TeeSpring. Give concise, actionable insights. Include specific suggestions with scores where relevant. Current niches being tracked: ${
        data.niches.map((n) => n.niche + (n.subNiche ? " - " + n.subNiche : "")).join(", ") || "none yet"
      }.`,
      "research"
    );
    setResult(r);
    setHistory((prev) => [{ q: query, a: r, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>AI Research</h1>
      <p style={{ color: C.textDim, fontSize: 19, margin: "0 0 24px", fontFamily: font }}>
        Ask Claude anything about POD niches, keywords, trends, or strategies
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <TextArea
          value={query}
          onChange={setQuery}
          placeholder='Try: "What are the best evergreen niches for POD in 2026?" or "Analyze the nursing profession for t-shirt potential"'
          rows={3}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {limits.research > 0 ? (
            <Btn onClick={research} disabled={!query.trim() || loading}>
              ✦ Research <UsageBadge used={usage.research || 0} limit={limits.research} />
            </Btn>
          ) : (
            <LockedBtn tooltip="Upgrade to Business to unlock AI Research.">✦ Research</LockedBtn>
          )}
          <Btn variant="ghost" onClick={() => setQuery("What are 5 trending hobbies for POD right now?")}>
            Trending hobbies
          </Btn>
          <Btn variant="ghost" onClick={() => setQuery("Suggest 5 occupation-based niches with low competition")}>
            Occupation niches
          </Btn>
          <Btn variant="ghost" onClick={() => setQuery("What seasonal trends should I prepare for in the next 2 months?")}>
            Seasonal trends
          </Btn>
        </div>
      </div>

      {loading && <Loading />}

      {result && (
        <div
          style={{
            background: C.accentGlow,
            border: `1px solid ${C.accentDim}`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontFamily: font,
              color: C.accent,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            ✦ Research Results
          </div>
          <div style={{ color: C.text, fontSize: 19, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: sansFont }}>
            {result}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 19,
              fontFamily: font,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Research History
          </h3>
          {history.map((h, i) => (
            <div
              key={i}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: C.accent, fontSize: 15, fontFamily: font, fontWeight: 600 }}>{h.q}</span>
                <span style={{ color: C.textMuted, fontSize: 19, fontFamily: font }}>{h.time}</span>
              </div>
              <div
                style={{
                  color: C.textDim,
                  fontSize: 15,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 120,
                  overflow: "hidden",
                }}
              >
                {h.a}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── IDEAS VIEW ────────────────────────────────
function IdeasView({ data, addItem, updateItem, deleteItem, update, openNicheHome }) {
  const ideas = useMemo(() => (Array.isArray(data.ideas) ? data.ideas : []), [data.ideas]);
  const [quickTitle, setQuickTitle] = useState("");
  const [activeIdeaId, setActiveIdeaId] = useState(null);
  const [editorDraft, setEditorDraft] = useState(null);
  const [draggingIdeaId, setDraggingIdeaId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const editorRef = useRef(null);

  const customNicheOptions = useMemo(
    () =>
      Array.from(
        new Set((data.customNiches || []).map((item) => normalizeNicheOptionLabel(item)).filter(Boolean))
      ).sort(),
    [data.customNiches]
  );
  const nicheOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_NICHE_OPTIONS,
          ...(data.niches || []).map((item) => normalizeNicheOptionLabel(item?.niche)).filter(Boolean),
          ...customNicheOptions,
        ])
      ).sort(),
    [customNicheOptions, data.niches]
  );
  const trendOptions = useMemo(
    () => Array.from(new Set((data.trends || []).map((item) => item?.trend).filter(Boolean))).sort(),
    [data.trends]
  );
  const keywordOptions = useMemo(
    () => Array.from(new Set((data.keywords || []).map((item) => item?.keyword).filter(Boolean))).sort(),
    [data.keywords]
  );
  const briefOptions = useMemo(
    () => (data.briefs || []).map((item) => ({
      id: item.id,
      label: `${item.id} · ${item.slogan || item.concept || item.niche || "Untitled brief"}`,
    })),
    [data.briefs]
  );
  const linkedListingsByIdeaId = useMemo(
    () =>
      Object.fromEntries(
        (data.inventory || [])
          .filter((item) => item?.ideaId)
          .map((item) => [item.ideaId, item])
      ),
    [data.inventory]
  );

  const buildListingDraft = useCallback((idea, source = {}) => {
    const briefIds = Array.isArray(idea?.briefIds) ? idea.briefIds.filter(Boolean) : [];
    return {
      sku: source?.sku || "",
      design: source?.design || idea?.title || "",
      briefId: source?.briefId || briefIds[0] || "",
      platform: source?.platform || idea?.platform || "Amazon Merch",
      url: source?.url || "",
      imageUrl: source?.imageUrl || "",
      status: source?.status || "Active",
      notes: source?.notes || "",
      dateListed: source?.dateListed || localDateKey(),
      sales: source?.sales ?? "",
    };
  }, []);

  const ideasByColumn = useMemo(
    () =>
      Object.fromEntries(
        IDEA_COLUMNS.map((column) => [
          column.id,
          ideas
            .filter((idea) => (idea?.status || "backlog") === column.id)
            .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()),
        ])
      ),
    [ideas]
  );

  const activeIdea = useMemo(
    () => ideas.find((idea) => idea.id === activeIdeaId) || null,
    [ideas, activeIdeaId]
  );

  useEffect(() => {
    if (!activeIdea) return;
    const linkedListing = linkedListingsByIdeaId[activeIdea.id];
    const listingSeed = { ...(activeIdea.listing || {}), ...(linkedListing || {}) };

    setEditorDraft({
      ...activeIdea,
      keywordsText: Array.isArray(activeIdea.keywords) ? activeIdea.keywords.join(", ") : "",
      briefIds: Array.isArray(activeIdea.briefIds) ? activeIdea.briefIds : [],
      listing: buildListingDraft(activeIdea, listingSeed),
    });
  }, [activeIdea, buildListingDraft, linkedListingsByIdeaId]);

  useEffect(() => {
    if (!activeIdea || !editorRef.current) return;
    const nextHtml = activeIdea.notesHtml || "<p></p>";
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [activeIdea]);

  useEffect(() => {
    if (!celebration) return undefined;
    const timeoutId = window.setTimeout(() => setCelebration(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [celebration]);

  const persistIdea = useCallback(
    async (idea) => {
      const index = ideas.findIndex((item) => item.id === idea.id);
      if (index === -1) {
        await addItem("ideas", idea);
        return;
      }
      await updateItem("ideas", index, idea);
    },
    [addItem, ideas, updateItem]
  );

  const saveCustomNiches = useCallback(
    async (nextOptions) => {
      const deduped = Array.from(
        new Set(
          nextOptions
            .map((item) => normalizeNicheOptionLabel(item))
            .filter(
              (item) =>
                item &&
                !DEFAULT_NICHE_OPTIONS.some(
                  (preset) => normalizeCompareValue(preset) === normalizeCompareValue(item)
                )
            )
        )
      ).sort();
      await update("customNiches", deduped);
      return deduped;
    },
    [update]
  );

  const handleAddCustomNiche = useCallback(
    async (nextValue) => {
      const normalized = normalizeNicheOptionLabel(nextValue);
      if (!normalized) return;
      if (nicheOptions.some((option) => normalizeCompareValue(option) === normalizeCompareValue(normalized))) {
        return;
      }
      await saveCustomNiches([...customNicheOptions, normalized]);
    },
    [customNicheOptions, nicheOptions, saveCustomNiches]
  );

  const handleRenameCustomNiche = useCallback(
    async (currentValue) => {
      const renamed = window.prompt("Rename custom niche", currentValue);
      const normalized = normalizeNicheOptionLabel(renamed);

      if (!normalized || normalizeCompareValue(normalized) === normalizeCompareValue(currentValue)) {
        return;
      }

      if (nicheOptions.some((option) => normalizeCompareValue(option) === normalizeCompareValue(normalized))) {
        alert("That niche already exists in the list.");
        return;
      }

      await saveCustomNiches(
        customNicheOptions.map((option) =>
          normalizeCompareValue(option) === normalizeCompareValue(currentValue) ? normalized : option
        )
      );

      setEditorDraft((prev) => (
        prev && normalizeCompareValue(prev.niche) === normalizeCompareValue(currentValue)
          ? { ...prev, niche: normalized }
          : prev
      ));
    },
    [customNicheOptions, nicheOptions, saveCustomNiches]
  );

  const handleDeleteCustomNiche = useCallback(
    async (targetValue) => {
      await saveCustomNiches(
        customNicheOptions.filter((option) => normalizeCompareValue(option) !== normalizeCompareValue(targetValue))
      );
    },
    [customNicheOptions, saveCustomNiches]
  );

  const createIdea = async () => {
    const title = quickTitle.trim();
    if (!title) return;

    const now = new Date().toISOString();
    const nextIdea = {
      id: generateIdeaId(),
      title,
      niche: "",
      trend: "",
      keywords: [],
      briefIds: [],
      platform: "Amazon Merch",
      status: "backlog",
      notesHtml: "<p></p>",
      updatedAt: now,
      createdAt: now,
    };

    await addItem("ideas", nextIdea);
    setQuickTitle("");
    setActiveIdeaId(nextIdea.id);
  };

  const moveIdea = useCallback(
    async (ideaId, nextStatus) => {
      const idea = ideas.find((item) => item.id === ideaId);
      if (!idea || idea.status === nextStatus) return;

      const updatedIdea = {
        ...idea,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      await persistIdea(updatedIdea);

      if (nextStatus === "posted") {
        setCelebration({
          title: idea.title,
          message: "Nice work. You moved an idea all the way to Posted.",
        });
      }
    },
    [ideas, persistIdea]
  );

  const saveEditor = async () => {
    if (!editorDraft) return;

    const html = editorRef.current?.innerHTML || editorDraft.notesHtml || "<p></p>";
    const normalizedListing = buildListingDraft(editorDraft, editorDraft.listing || {});
    const nextIdea = {
      ...editorDraft,
      title: editorDraft.title?.trim() || "Untitled Idea",
      niche: editorDraft.niche?.trim() || "",
      trend: editorDraft.trend?.trim() || "",
      platform: editorDraft.platform?.trim() || "Amazon Merch",
      keywords: (editorDraft.keywordsText || "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      briefIds: Array.isArray(editorDraft.briefIds) ? editorDraft.briefIds.filter(Boolean) : [],
      listing: activeIdea?.listing || linkedListingsByIdeaId[editorDraft.id] || null,
      notesHtml: html,
      updatedAt: new Date().toISOString(),
    };

    const linkedListingIndex = (data.inventory || []).findIndex((item) => item?.ideaId === nextIdea.id);
    const hasLinkedListing = linkedListingIndex >= 0;
    const hasMeaningfulListingData =
      !!normalizedListing.sku.trim() ||
      !!normalizedListing.url.trim() ||
      !!normalizedListing.imageUrl.trim() ||
      !!normalizedListing.notes.trim() ||
      !!String(normalizedListing.sales ?? "").trim() ||
      (normalizedListing.design || "").trim() !== (nextIdea.title || "").trim();

    if (nextIdea.status === "posted" && (hasLinkedListing || hasMeaningfulListingData)) {
      const nextInventoryItem = {
        ...normalizedListing,
        ideaId: nextIdea.id,
        design: normalizedListing.design?.trim() || nextIdea.title || "Untitled Idea",
        briefId: normalizedListing.briefId?.trim() || nextIdea.briefIds?.[0] || "",
        platform: normalizedListing.platform?.trim() || nextIdea.platform || "Amazon Merch",
        url: normalizedListing.url?.trim() || "",
        imageUrl: normalizedListing.imageUrl?.trim() || "",
        status: normalizedListing.status || "Active",
        notes: normalizedListing.notes?.trim() || "",
        dateListed: normalizedListing.dateListed || localDateKey(),
        sales: normalizedListing.sales === "" ? "" : Number(normalizedListing.sales) || 0,
      };
      nextIdea.listing = { ...nextInventoryItem };
      delete nextIdea.listing.ideaId;

      if (hasLinkedListing) {
        await updateItem("inventory", linkedListingIndex, {
          ...data.inventory[linkedListingIndex],
          ...nextInventoryItem,
        });
      } else {
        await addItem("inventory", nextInventoryItem);
      }
    }

    await persistIdea(nextIdea);
    setActiveIdeaId(nextIdea.id);
  };

  const removeIdea = async () => {
    if (!activeIdea) return;
    const index = ideas.findIndex((item) => item.id === activeIdea.id);
    if (index === -1) return;
    await deleteItem("ideas", index);
    setActiveIdeaId(null);
    setEditorDraft(null);
  };

  const applyFormat = (command) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false);
  };

  const infoButtonStyle = {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: `1px solid ${C.borderLight}`,
    background: "rgba(255,255,255,0.04)",
    color: C.textMuted,
    fontFamily: sansFont,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "help",
  };

  return (
    <div>
      {celebration && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 40,
            background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.14))",
            border: `1px solid ${C.success}`,
            borderRadius: 12,
            padding: "14px 18px",
            boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
            maxWidth: 340,
          }}
        >
          <div style={{ fontFamily: font, fontSize: 13, color: C.success, textTransform: "uppercase", letterSpacing: 1 }}>
            +1 Completed
          </div>
          <div style={{ fontFamily: sansFont, fontSize: 18, color: C.white, fontWeight: 700, marginTop: 4 }}>
            {celebration.title}
          </div>
          <div style={{ fontSize: 14, color: C.text, marginTop: 4 }}>{celebration.message}</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Ideas Board</h1>
          <p style={{ color: C.textDim, fontSize: 19, margin: 0, fontFamily: font }}>
            Capture concepts quickly, then pull them across the design workflow as they mature.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Input
            value={quickTitle}
            onChange={setQuickTitle}
            placeholder="Add a new idea to Backlog"
            style={{ minWidth: 260 }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createIdea();
              }
            }}
          />
          <Btn onClick={createIdea} disabled={!quickTitle.trim()}>
            + New Idea
          </Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, alignItems: "start" }}>
        {IDEA_COLUMNS.map((column) => {
          const columnIdeas = ideasByColumn[column.id] || [];

          return (
            <div
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                event.preventDefault();
                const ideaId = event.dataTransfer.getData("text/plain") || draggingIdeaId;
                setDraggingIdeaId(null);
                if (ideaId) {
                  await moveIdea(ideaId, column.id);
                }
              }}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                minHeight: 420,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 5, background: column.stripe }} />
              <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: font, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.8, color: C.white }}>
                    {column.label}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{columnIdeas.length} card{columnIdeas.length === 1 ? "" : "s"}</div>
                </div>
                <Tooltip title={column.help}>
                  <button type="button" aria-label={`How to use ${column.label}`} style={infoButtonStyle}>
                    i
                  </button>
                </Tooltip>
              </div>

              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10, minHeight: 360 }}>
                {columnIdeas.length === 0 ? (
                  <div
                    style={{
                      border: `1px dashed ${C.borderLight}`,
                      borderRadius: 10,
                      padding: 18,
                      color: C.textMuted,
                      fontSize: 14,
                      lineHeight: 1.5,
                      textAlign: "center",
                    }}
                  >
                    Drop a card here when it reaches this stage.
                  </div>
                ) : (
                  columnIdeas.map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", idea.id);
                        setDraggingIdeaId(idea.id);
                      }}
                      onDragEnd={() => setDraggingIdeaId(null)}
                      onClick={() => setActiveIdeaId(idea.id)}
                      style={{
                        textAlign: "left",
                        border: idea.id === activeIdeaId ? `1px solid ${column.stripe}` : `1px solid ${C.border}`,
                        background: idea.id === activeIdeaId ? "rgba(255,255,255,0.03)" : C.surface,
                        borderRadius: 10,
                        padding: 10,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ fontFamily: sansFont, fontSize: 15, fontWeight: 700, color: C.white, lineHeight: 1.3 }}>
                          {idea.title || "Untitled Idea"}
                        </div>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>⋮⋮</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {idea.niche && (
                          <NicheLink niche={idea.niche} onOpen={openNicheHome} style={{ textDecoration: "none" }}>
                            <Badge>{idea.niche}</Badge>
                          </NicheLink>
                        )}
                        {idea.trend && <Badge color="warn">{idea.trend}</Badge>}
                      </div>
                      {!!idea.keywords?.length && (
                        <div style={{ marginTop: 8, color: C.textDim, fontSize: 13, lineHeight: 1.4 }}>
                          {idea.keywords.slice(0, 3).join(", ")}
                          {idea.keywords.length > 3 ? ` +${idea.keywords.length - 3}` : ""}
                        </div>
                      )}
                  {!!idea.briefIds?.length && (
                        <div style={{ marginTop: 8, color: C.textMuted, fontSize: 12, lineHeight: 1.4 }}>
                          Briefs: {idea.briefIds.slice(0, 2).join(", ")}
                          {idea.briefIds.length > 2 ? ` +${idea.briefIds.length - 2}` : ""}
                        </div>
                      )}
                      {idea.status === "posted" && (linkedListingsByIdeaId[idea.id] || idea.listing) && (
                        <div style={{ marginTop: 8, color: C.success, fontSize: 12, lineHeight: 1.4 }}>
                          Listing: {(linkedListingsByIdeaId[idea.id] || idea.listing)?.platform || "Amazon Merch"} ·{" "}
                          {(linkedListingsByIdeaId[idea.id] || idea.listing)?.status || "Draft"}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeIdea && editorDraft && (
        <>
          <div
            onClick={() => setActiveIdeaId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.46)",
              zIndex: 30,
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(560px, 100vw)",
              height: "100vh",
              background: C.surface,
              borderLeft: `1px solid ${C.border}`,
              zIndex: 31,
              padding: 24,
              overflowY: "auto",
              boxShadow: "-16px 0 48px rgba(0,0,0,0.32)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: font, fontSize: 13, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
                  Idea Details
                </div>
                <div style={{ fontSize: 24, color: C.white, fontWeight: 700, fontFamily: sansFont }}>
                  {activeIdea.title || "Untitled Idea"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveIdeaId(null)}
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.textDim,
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Title</label>
                <Input
                  value={editorDraft.title || ""}
                  onChange={(value) => setEditorDraft((prev) => ({ ...prev, title: value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Niche</label>
                  <StandaloneNicheSelect
                    value={editorDraft.niche || ""}
                    onChange={(value) => setEditorDraft((prev) => ({ ...prev, niche: value }))}
                    presetOptions={DEFAULT_NICHE_OPTIONS}
                    customOptions={customNicheOptions}
                    onAddCustom={handleAddCustomNiche}
                    onRenameCustom={handleRenameCustomNiche}
                    onDeleteCustom={handleDeleteCustomNiche}
                    colors={C}
                    fontFamily={font}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Trend</label>
                  <Input
                    value={editorDraft.trend || ""}
                    onChange={(value) => setEditorDraft((prev) => ({ ...prev, trend: value }))}
                    placeholder="Pick or type a trend"
                    list="idea-trend-options"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Keywords</label>
                  <Input
                    value={editorDraft.keywordsText || ""}
                    onChange={(value) => setEditorDraft((prev) => ({ ...prev, keywordsText: value }))}
                    placeholder="Comma-separated keywords"
                    list="idea-keyword-options"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Status</label>
                  <select
                    value={editorDraft.status || "backlog"}
                    onChange={(event) => setEditorDraft((prev) => ({ ...prev, status: event.target.value }))}
                    style={{
                      width: "100%",
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      color: C.text,
                      fontFamily: font,
                      padding: "11px 12px",
                    }}
                  >
                    {IDEA_COLUMNS.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Design Briefs</label>
                <select
                  multiple
                  value={editorDraft.briefIds || []}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                    setEditorDraft((prev) => ({ ...prev, briefIds: values }));
                  }}
                  style={{
                    width: "100%",
                    minHeight: 132,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    fontFamily: font,
                    padding: "10px 12px",
                  }}
                >
                  {briefOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>
                  Hold `Ctrl` or `Cmd` to select multiple briefs.
                </div>
              </div>

              {editorDraft.status === "posted" && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: font, fontSize: 13, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>
                        Listing Details
                      </div>
                      <div style={{ fontSize: 14, color: C.textDim, marginTop: 4 }}>
                        Save this idea to sync the listing into the Listings table.
                      </div>
                    </div>
                    <Badge color="success">Posted</Badge>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>SKU</label>
                      <Input
                        value={editorDraft.listing?.sku || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), sku: value } }))
                        }
                        placeholder="POD-001"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Design</label>
                      <Input
                        value={editorDraft.listing?.design || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), design: value } }))
                        }
                        placeholder="Design name"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Brief ID</label>
                      <Input
                        value={editorDraft.listing?.briefId || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), briefId: value } }))
                        }
                        placeholder="DB-001"
                        list="idea-brief-options"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Platform</label>
                      <Select
                        value={editorDraft.listing?.platform || "Amazon Merch"}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), platform: value } }))
                        }
                        options={PLATFORMS}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Status</label>
                      <Select
                        value={editorDraft.listing?.status || "Active"}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), status: value } }))
                        }
                        options={LISTING_STATUS}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Date Listed</label>
                      <Input
                        type="date"
                        value={editorDraft.listing?.dateListed || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), dateListed: value } }))
                        }
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Listing URL</label>
                      <Input
                        value={editorDraft.listing?.url || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), url: value } }))
                        }
                        placeholder="https://example.com/listing"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Image URL</label>
                      <Input
                        value={editorDraft.listing?.imageUrl || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), imageUrl: value } }))
                        }
                        placeholder="https://images.example.com/design.jpg"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Sales</label>
                      <Input
                        type="number"
                        value={editorDraft.listing?.sales ?? ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), sales: value } }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Listing Notes</label>
                      <Input
                        value={editorDraft.listing?.notes || ""}
                        onChange={(value) =>
                          setEditorDraft((prev) => ({ ...prev, listing: { ...(prev.listing || {}), notes: value } }))
                        }
                        placeholder="Launch notes, pricing, performance..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontFamily: font, color: C.textMuted, fontSize: 13, marginBottom: 6 }}>Notes</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <Btn variant="ghost" onClick={() => applyFormat("bold")} style={{ fontSize: 13, padding: "6px 10px" }}>
                    Bold
                  </Btn>
                  <Btn variant="ghost" onClick={() => applyFormat("italic")} style={{ fontSize: 13, padding: "6px 10px" }}>
                    Italic
                  </Btn>
                  <Btn variant="ghost" onClick={() => applyFormat("insertUnorderedList")} style={{ fontSize: 13, padding: "6px 10px" }}>
                    Bullets
                  </Btn>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(event) => {
                    const notesHtml = event.currentTarget?.innerHTML || "<p></p>";
                    setEditorDraft((prev) => ({ ...prev, notesHtml }));
                  }}
                  style={{
                    minHeight: 220,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 14,
                    color: C.text,
                    fontFamily: sansFont,
                    fontSize: 15,
                    lineHeight: 1.6,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
                <Btn variant="danger" onClick={removeIdea}>
                  Delete
                </Btn>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setActiveIdeaId(null)}>
                    Close
                  </Btn>
                  <Btn
                    onClick={async () => {
                      const previousStatus = activeIdea.status;
                      await saveEditor();
                      if (editorDraft.status === "posted" && previousStatus !== "posted") {
                        setCelebration({
                          title: editorDraft.title || "Untitled Idea",
                          message: "Nice work. You moved an idea all the way to Posted.",
                        });
                      }
                    }}
                  >
                    Save Idea
                  </Btn>
                </div>
              </div>
            </div>

            <datalist id="idea-brief-options">
              {briefOptions.map((option) => (
                <option key={option.id} value={option.id} />
              ))}
            </datalist>
            <datalist id="idea-trend-options">
              {trendOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <datalist id="idea-keyword-options">
              {keywordOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </aside>
        </>
      )}
    </div>
  );
}

// ─── NICHE HOME VIEW ───────────────────────────
function NicheHomeView({
  data,
  selectedNicheContext,
  setSelectedNicheContext,
  openNicheHome,
  plan,
  usage,
  setUsage,
  loading,
  setLoading,
  addItem,
  updateItem,
}) {
  const niche = selectedNicheContext?.niche || "";
  const subNiche = selectedNicheContext?.subNiche || "";
  const notesRef = useRef(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [savedBanner, setSavedBanner] = useState(false);
  const limits = PLAN_LIMITS[plan];
  const nicheKey = getNicheProfileId(niche);

  const relatedNiches = useMemo(
    () => (data.niches || []).filter((item) => normalizeCompareValue(item.niche) === nicheKey),
    [data.niches, nicheKey]
  );
  const relatedKeywords = useMemo(
    () =>
      (data.keywords || []).filter((item) => {
        if (normalizeCompareValue(item.niche) !== nicheKey) return false;
        return !subNiche || normalizeCompareValue(item.subNiche) === normalizeCompareValue(subNiche);
      }),
    [data.keywords, nicheKey, subNiche]
  );
  const relatedBriefs = useMemo(
    () =>
      (data.briefs || []).filter((item) => {
        if (normalizeCompareValue(item.niche) !== nicheKey) return false;
        return !subNiche || normalizeCompareValue(item.subNiche) === normalizeCompareValue(subNiche);
      }),
    [data.briefs, nicheKey, subNiche]
  );
  const relatedIdeas = useMemo(
    () =>
      (data.ideas || []).filter((item) => normalizeCompareValue(item.niche) === nicheKey),
    [data.ideas, nicheKey]
  );
  const briefIdSet = useMemo(
    () => new Set(relatedBriefs.map((item) => item.id).filter(Boolean)),
    [relatedBriefs]
  );
  const relatedListings = useMemo(
    () =>
      (data.inventory || []).filter((item) => {
        if (briefIdSet.has(item.briefId)) return true;
        if (!subNiche) return false;
        return normalizeCompareValue(item.design).includes(normalizeCompareValue(subNiche));
      }),
    [data.inventory, briefIdSet, subNiche]
  );
  const profileIndex = useMemo(
    () => (data.nicheProfiles || []).findIndex((item) => getNicheProfileId(item?.niche) === nicheKey),
    [data.nicheProfiles, nicheKey]
  );
  const profile = profileIndex >= 0 ? data.nicheProfiles[profileIndex] : null;
  const subNicheOptions = useMemo(
    () =>
      Array.from(new Set(relatedNiches.map((item) => item.subNiche || "General").filter(Boolean))).sort(),
    [relatedNiches]
  );
  const focusNiches = useMemo(
    () =>
      subNiche
        ? relatedNiches.filter((item) => normalizeCompareValue(item.subNiche) === normalizeCompareValue(subNiche))
        : relatedNiches,
    [relatedNiches, subNiche]
  );
  const avgScore = useMemo(() => {
    const scores = focusNiches.map((item) => Number(item.score)).filter((value) => !Number.isNaN(value));
    if (!scores.length) return "—";
    return (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1);
  }, [focusNiches]);

  useEffect(() => {
    if (!niche) return;
    setProfileDraft({
      niche,
      notesHtml: profile?.notesHtml || "<p></p>",
      aiResearch: profile?.aiResearch || null,
      updatedAt: profile?.updatedAt || "",
    });
  }, [niche, profile]);

  useEffect(() => {
    if (!profileDraft || !notesRef.current) return;
    const nextHtml = profileDraft.notesHtml || "<p></p>";
    if (notesRef.current.innerHTML !== nextHtml) {
      notesRef.current.innerHTML = nextHtml;
    }
  }, [profileDraft]);

  useEffect(() => {
    if (!savedBanner) return undefined;
    const timeoutId = window.setTimeout(() => setSavedBanner(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [savedBanner]);

  const saveProfile = useCallback(
    async (updates = {}) => {
      if (!niche) return;
      const nextProfile = {
        niche,
        notesHtml: notesRef.current?.innerHTML || profileDraft?.notesHtml || "<p></p>",
        aiResearch: profileDraft?.aiResearch || null,
        updatedAt: new Date().toISOString(),
        ...updates,
      };

      if (profileIndex >= 0) {
        await updateItem("nicheProfiles", profileIndex, nextProfile);
      } else {
        await addItem("nicheProfiles", nextProfile);
      }

      setProfileDraft(nextProfile);
      setSavedBanner(true);
    },
    [addItem, niche, profileDraft, profileIndex, updateItem]
  );

  const runNicheResearch = async () => {
    if (!niche) return;
    const featureKey = plan === "business" ? "research" : "dceb";
    if (plan === "free") return;

    if (featureKey === "research") {
      const allowed = await checkAndConsumeUsage("research", plan, usage, setUsage);
      if (!allowed) {
        alert(`AI Research limit reached (${limits.research}/day). Resets at midnight.`);
        return;
      }
    } else {
      const allowed = await checkAndConsumeUsage("dceb", plan, usage, setUsage);
      if (!allowed) {
        alert(`DCEB limit reached (${limits.dceb}/day). Resets at midnight.`);
        return;
      }
    }

    setLoading(true);
    const result = await askClaudeJSON(
      `Build a niche research dashboard summary for the Print on Demand niche "${niche}"${subNiche ? ` with a focus on sub-niche "${subNiche}"` : ""}.

Return JSON:
{
  "overview":"2-3 sentence summary",
  "audience":"who buys in this niche",
  "opportunities":["...","...","..."],
  "risks":["...","..."],
  "suggestedSubNiches":["...","...","..."],
  "suggestedKeywords":["...","...","..."],
  "nextActions":["...","...","..."]
}`,
      "You are a Print on Demand niche strategist. Be specific, practical, and concise.",
      featureKey
    );
    setLoading(false);

    if (!result) {
      alert("Could not generate niche research right now.");
      return;
    }

    await saveProfile({ aiResearch: result });
  };

  const applyFormat = (command) => {
    if (!notesRef.current) return;
    notesRef.current.focus();
    document.execCommand(command, false);
  };

  if (!niche) {
    return (
      <div>
        <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 8px" }}>Niche Home</h1>
        <p style={{ color: C.textDim, fontSize: 18, margin: 0, fontFamily: font }}>
          Open a niche from the tracker to see its dashboard, related records, and notes.
        </p>
      </div>
    );
  }

  const focusTitle = subNiche ? `${niche} / ${subNiche}` : niche;
  const primaryNicheRecord = focusNiches[0] || relatedNiches[0] || null;

  return (
    <div>
      {savedBanner && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: C.successDim, color: C.success, fontFamily: font, fontSize: 14 }}>
          Niche profile saved.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Badge color="accent">Niche Home</Badge>
            {subNiche && <Badge color="warn">Focused on {subNiche}</Badge>}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 6px", fontFamily: sansFont }}>{focusTitle}</h1>
          <p style={{ color: C.textDim, fontSize: 17, margin: 0, fontFamily: font }}>
            A patient-chart style dashboard for this niche, with related sub-niches, briefs, listings, and notes.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {plan === "free" ? (
            <LockedBtn tooltip="Upgrade to Starter or Business to run AI niche research.">✦ AI Niche Research</LockedBtn>
          ) : (
            <Btn onClick={runNicheResearch} disabled={loading}>
              ✦ AI Niche Research
            </Btn>
          )}
          <Btn variant="ghost" onClick={() => setSelectedNicheContext({ niche, subNiche: "" })}>
            Reset Focus
          </Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Sub-Niches" value={subNicheOptions.length} sub="tracked under this niche" />
        <StatCard label="Keywords" value={relatedKeywords.length} sub="linked research terms" color={C.warn} />
        <StatCard label="Briefs" value={relatedBriefs.length} sub="design concepts" color="#8b5cf6" />
        <StatCard label="Listings" value={relatedListings.length} sub="live or tracked" color={C.success} />
        <StatCard label="Avg DCEB" value={avgScore} sub="for tracked niche rows" color={C.accent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Niche Snapshot
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Current Status</div>
              <div style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>{primaryNicheRecord?.status || "Researching"}</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Latest Score</div>
              <div style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>{primaryNicheRecord?.score || "—"}</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Top Keyword</div>
              <div style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>{relatedKeywords[0]?.keyword || "—"}</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Latest Brief</div>
              <div style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>{relatedBriefs[0]?.id || "—"}</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 10, fontFamily: font, textTransform: "uppercase", letterSpacing: 1 }}>
              Sub-Niche Lineup
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {subNicheOptions.length ? (
                subNicheOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => openNicheHome(niche, option === "General" ? "" : option)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: `1px solid ${normalizeCompareValue(subNiche) === normalizeCompareValue(option === "General" ? "" : option) ? C.accent : C.border}`,
                      background: normalizeCompareValue(subNiche) === normalizeCompareValue(option === "General" ? "" : option) ? C.accentGlow : C.surface,
                      color: normalizeCompareValue(subNiche) === normalizeCompareValue(option === "General" ? "" : option) ? C.accent : C.text,
                      cursor: "pointer",
                      fontFamily: font,
                    }}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div style={{ color: C.textMuted }}>No sub-niches tracked yet.</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            AI Research Snapshot
          </div>
          {profileDraft?.aiResearch ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ color: C.text, lineHeight: 1.7 }}>{profileDraft.aiResearch.overview}</div>
              <div>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Audience</div>
                <div style={{ color: C.white }}>{profileDraft.aiResearch.audience}</div>
              </div>
              {profileDraft.aiResearch.opportunities?.length > 0 && (
                <div>
                  <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Opportunities</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profileDraft.aiResearch.opportunities.map((item, index) => (
                      <Badge key={index} color="success">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileDraft.aiResearch.suggestedKeywords?.length > 0 && (
                <div>
                  <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6, fontFamily: font }}>Suggested Keywords</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profileDraft.aiResearch.suggestedKeywords.map((item, index) => (
                      <Badge key={index}>{item}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: C.textMuted, lineHeight: 1.7 }}>
              Run AI niche research to generate a strategic snapshot, opportunity set, and next steps for this niche.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24 }}>
        <div style={{ display: "grid", gap: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
              Related Work
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ background: C.surface, borderRadius: 10, padding: 14 }}>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 8, fontFamily: font }}>Keywords</div>
                {relatedKeywords.length ? relatedKeywords.slice(0, 6).map((item, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: index < Math.min(relatedKeywords.length, 6) - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ color: C.white }}>{item.keyword}</div>
                    <div style={{ color: C.textMuted }}>{item.volume || "—"}</div>
                  </div>
                )) : <div style={{ color: C.textMuted }}>No keywords linked yet.</div>}
              </div>
              <div style={{ background: C.surface, borderRadius: 10, padding: 14 }}>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 8, fontFamily: font }}>Design Briefs</div>
                {relatedBriefs.length ? relatedBriefs.slice(0, 5).map((item, index) => (
                  <div key={index} style={{ padding: "6px 0", borderBottom: index < Math.min(relatedBriefs.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ color: C.white, fontWeight: 700 }}>{item.id}</div>
                    <div style={{ color: C.textDim, fontSize: 14 }}>{item.slogan || item.concept}</div>
                  </div>
                )) : <div style={{ color: C.textMuted }}>No briefs linked yet.</div>}
              </div>
              <div style={{ background: C.surface, borderRadius: 10, padding: 14 }}>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 8, fontFamily: font }}>Listings</div>
                {relatedListings.length ? relatedListings.slice(0, 5).map((item, index) => (
                  <div key={index} style={{ padding: "6px 0", borderBottom: index < Math.min(relatedListings.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ color: C.white, fontWeight: 700 }}>{item.design || item.sku}</div>
                    <div style={{ color: C.textDim, fontSize: 14 }}>{item.platform} · {item.status}</div>
                  </div>
                )) : <div style={{ color: C.textMuted }}>No linked listings yet.</div>}
              </div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
              Ideas Queue
            </div>
            {relatedIdeas.length ? relatedIdeas.slice(0, 6).map((idea, index) => (
              <div key={idea.id || index} style={{ padding: "8px 0", borderBottom: index < Math.min(relatedIdeas.length, 6) - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ color: C.white, fontWeight: 700 }}>{idea.title}</div>
                <div style={{ color: C.textDim, fontSize: 14 }}>{idea.status || "backlog"}</div>
              </div>
            )) : <div style={{ color: C.textMuted }}>No ideas tied to this niche yet.</div>}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: font, fontSize: 14, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
              Notes
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => applyFormat("bold")} style={{ fontSize: 13, padding: "6px 10px" }}>Bold</Btn>
              <Btn variant="ghost" onClick={() => applyFormat("italic")} style={{ fontSize: 13, padding: "6px 10px" }}>Italic</Btn>
              <Btn variant="ghost" onClick={() => applyFormat("insertUnorderedList")} style={{ fontSize: 13, padding: "6px 10px" }}>Bullets</Btn>
            </div>
          </div>
          <div
            ref={notesRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              const notesHtml = event.currentTarget?.innerHTML || "<p></p>";
              setProfileDraft((prev) => ({ ...(prev || {}), niche, notesHtml }));
            }}
            style={{
              minHeight: 320,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 14,
              color: C.text,
              fontFamily: sansFont,
              fontSize: 15,
              lineHeight: 1.6,
              outline: "none",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 12 }}>
            <div style={{ color: C.textMuted, fontSize: 13 }}>
              Use this as the chart note for the niche: observations, blockers, ideas, and follow-up tasks.
            </div>
            <Btn onClick={() => saveProfile()}>Save Notes</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GUIDE VIEW ────────────────────────────────
function GuideView() {
  const sectionStyle = { marginBottom: 32 };
  const h2 = { fontSize: 21, fontWeight: 700, color: C.white, margin: "0 0 12px", fontFamily: sansFont };
  const h3 = { fontSize: 17, fontWeight: 600, color: C.accent, margin: "16px 0 8px", fontFamily: font };
  const p = { fontSize: 15, color: C.textDim, lineHeight: 1.8, margin: "0 0 12px", fontFamily: sansFont };

  const step = (num, title, desc) => (
    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: C.accent,
          color: C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font,
          fontSize: 15,
          fontWeight: 800,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {num}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 15, color: C.textDim, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>Guide</h1>
      <p style={{ color: C.textDim, fontSize: 16, margin: "0 0 32px", fontFamily: font }}>
        Everything you need to know about using the PODTrackerPro
      </p>

      <div style={sectionStyle}>
        <h2 style={h2}>Getting Started</h2>
        <p style={p}>
          The PODTrackerPro has 8 working tabs plus this guide. The sidebar on the left lets you jump between them. The Dashboard tab is your home base. It shows stats pulled from all your other tabs.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2}>Step-by-Step Workflow</h2>
        {step(
          1,
          "Research a Niche",
          'Go to the Niches tab. Type a broad niche like "Fishing" or "Nursing" and click "DCEB Auto-Score" to get Demand, Competition, Evergreen, and Brandability scores from AI. Or click "Explore Sub-Niches" to break it into 5-6 sub-niches with scores. Click the green "+ Add" button to save any result to your tracker.'
        )}
        {step(
          2,
          "Research Keywords",
          'Go to the Keywords tab. Type a niche and click "AI Keyword Research." Claude suggests 8-10 keywords with volume and competition estimates. Click "+ Add" on the ones you want to keep.'
        )}
        {step(
          3,
          "Scan for Trends",
          'Go to the Trends tab. Click "AI Trend Scan" to discover current trending topics for POD. Each trend gets a score and seasonality tag. You can also manually add trends you spot yourself.'
        )}
        {step(
          4,
          "Create Design Briefs",
          'Go to the Design Briefs tab. Enter a niche, optional sub-niche, and a keyword or slogan. Click "AI Generate Briefs" to get 4 concept briefs with style directions, copyright-free slogans, and target platform recommendations. Each saved brief gets a unique ID like DB-001.'
        )}
        {step(
          5,
          "Generate SEO Copy",
          'Go to the SEO Copy tab. Pick a Design Brief ID from the dropdown and select a platform. Click "Generate SEO Copy." Claude writes a title, 2 feature bullets, and a story-telling description, all within the platform character limits shown in real time. Click "Save to Templates" to store it.'
        )}
        {step(
          6,
          "Track Your Listings",
          "Go to the Inventory tab. When you publish a design to a platform, add it here with a SKU, design name, platform, listing URL, and status. This is your master list of everything that's live."
        )}
        {step(
          7,
          "Free-Form Research",
          'Go to the AI Research tab for open-ended questions. Ask anything like "What occupation niches have low competition?" Quick-start buttons are provided for common queries.'
        )}
        {step(
          8,
          "Check Your Dashboard",
          "The Dashboard tab shows summary stats: total niches, active listings, pending briefs, keyword count, listings by platform, and recent trends."
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={h2}>PODTrackerPro Data Sources</h2>
        <p style={p}>Understanding where your data comes from helps you make better decisions about how much to trust each data point.</p>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <h3 style={h3}>Source 1: Claude AI (Anthropic API)</h3>
          <p style={p}>
            This powers DCEB scoring, keyword research, trend scanning, design briefs, and SEO copy. When you click any AI button, PODTrackerPro sends a question to Claude over the internet. Claude was trained on a massive amount of publicly available text, e-commerce data, seller guides, SEO best practices, Amazon Merch and Etsy forums, marketing blogs, and product listing strategies.
          </p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <h3 style={h3}>Source 2: Your Manual Input</h3>
          <p style={p}>
            The Inventory Tracker and parts of other tabs accept data you type in yourself, from your live platform accounts, your sales data, and your own research. This is your ground truth and the most accurate data in the system because it comes directly from your business.
          </p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <h3 style={h3}>Source 3: Persistent Storage</h3>
          <p style={p}>
            Everything you save is stored in a cross-session storage layer tied to your account. Your data persists between chat sessions so you don&apos;t lose your work. If you delete an item by clicking ✕, it&apos;s gone permanently.
          </p>
        </div>

        <div style={{ background: C.accentGlow, border: `1px solid ${C.accentDim}`, borderRadius: 8, padding: 16 }}>
          <p style={{ ...p, margin: 0, fontSize: 14 }}>
            <strong style={{ color: C.accent }}>Need real-time data?</strong> The React dashboard is best for AI analysis and tracking. Live market research is still best done with a browsing workflow outside the app.
          </p>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2}>CSV Import and Export</h2>
        <p style={p}>
          Niches, Keywords, Trends, and Inventory support CSV import and export. Sample CSV downloads are included so you can see the expected column headers and formatting before importing your own file.
        </p>
        <p style={p}>
          On import, you can choose to append everything or skip duplicates. Dedupe keys are based on the main identifying fields for each section.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2}>Your Data</h2>
        <p style={p}>
          Everything you add is saved automatically and persists across sessions. Close this chat, come back tomorrow, and all your niches, keywords, briefs, and inventory will still be here.
        </p>
        <p style={p}>Deleting an item by clicking the ✕ button removes it permanently. There is no undo.</p>
      </div>
    </div>
  );
}

