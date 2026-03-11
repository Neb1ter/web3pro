import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { Menu, X } from 'lucide-react';
import { SeoManager } from "@/components/SeoManager";

// ... (rest of the file remains the same)

export default function Web3Guide() {
  useScrollMemory();
  const [activeSection, setActiveSection] = useState('intro');

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
    );

    navSections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el && observer.current) {
        observer.current.observe(el);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      <SeoManager
        title="Web3 入圈指南 | Get8 Pro"
        description="从零开始，系统化学习区块链、DeFi 与 Web3 核心知识。我们为你臻选了最易懂的学习路径，让你轻松 Get it，构建完整的知识体系。"
        path="/web3-guide"
        keywords="Web3教程, 区块链基础, DeFi入门, 钱包使用, 智能合约, Web3 tutorial, blockchain basics, DeFi intro, wallet guide, smart contracts"
      />
      <div className="min-h-screen bg-gray-950 text-white">
        {/* ... (rest of the JSX remains the same) */}
      </div>
    </>
  );
}
