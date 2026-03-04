import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  MessageCircle,
  QrCode,
  Share2,
  Twitter,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { SiFacebook, SiTelegram, SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function ShareModal({
  open,
  onOpenChange,
  url,
  title,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code whenever the QR tab is active or the modal opens
  useEffect(() => {
    if (!open || activeTab !== "qr") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, url, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).catch(() => {
      // silent fail — user can still copy link
    });
  }, [open, activeTab, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const openShare = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="share.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold flex items-center gap-2">
            <Share2 className="h-4 w-4 text-gold" />
            Share
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex rounded-lg overflow-hidden border border-border bg-secondary p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-ui font-semibold transition-all duration-200",
              activeTab === "link"
                ? "bg-gold/20 text-gold shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-ocid="share.link.tab"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-ui font-semibold transition-all duration-200",
              activeTab === "qr"
                ? "bg-gold/20 text-gold shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-ocid="share.qr.panel"
          >
            <QrCode className="h-3.5 w-3.5" />
            QR Code
          </button>
        </div>

        {/* Link tab */}
        {activeTab === "link" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                className="bg-secondary border-border font-mono text-xs text-muted-foreground flex-1 min-w-0"
                onClick={(e) => (e.target as HTMLInputElement).select()}
                data-ocid="share.link.input"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                data-ocid="share.copy.button"
                className={cn(
                  "shrink-0 gap-1.5 font-ui font-semibold transition-all duration-200 px-3",
                  copied
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30",
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Social sharing */}
            <div>
              <p className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider mb-2.5">
                Share on
              </p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => openShare(twitterUrl)}
                  data-ocid="share.twitter.button"
                  aria-label="Share on Twitter/X"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary border border-border hover:border-[#1DA1F2]/40 hover:bg-[#1DA1F2]/10 transition-all duration-200 group"
                >
                  <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-[#1DA1F2] transition-colors" />
                  <span className="text-[10px] font-ui text-muted-foreground group-hover:text-foreground transition-colors">
                    Twitter
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openShare(facebookUrl)}
                  data-ocid="share.facebook.button"
                  aria-label="Share on Facebook"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary border border-border hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 transition-all duration-200 group"
                >
                  <SiFacebook className="h-5 w-5 text-muted-foreground group-hover:text-[#1877F2] transition-colors" />
                  <span className="text-[10px] font-ui text-muted-foreground group-hover:text-foreground transition-colors">
                    Facebook
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openShare(whatsappUrl)}
                  data-ocid="share.whatsapp.button"
                  aria-label="Share on WhatsApp"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary border border-border hover:border-[#25D366]/40 hover:bg-[#25D366]/10 transition-all duration-200 group"
                >
                  <SiWhatsapp className="h-5 w-5 text-muted-foreground group-hover:text-[#25D366] transition-colors" />
                  <span className="text-[10px] font-ui text-muted-foreground group-hover:text-foreground transition-colors">
                    WhatsApp
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openShare(telegramUrl)}
                  data-ocid="share.telegram.button"
                  aria-label="Share on Telegram"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary border border-border hover:border-[#26A5E4]/40 hover:bg-[#26A5E4]/10 transition-all duration-200 group"
                >
                  <SiTelegram className="h-5 w-5 text-muted-foreground group-hover:text-[#26A5E4] transition-colors" />
                  <span className="text-[10px] font-ui text-muted-foreground group-hover:text-foreground transition-colors">
                    Telegram
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR tab */}
        {activeTab === "qr" && (
          <div
            className="flex flex-col items-center gap-4 py-2"
            data-ocid="share.qr.panel"
          >
            <div className="rounded-xl overflow-hidden border-4 border-white shadow-[0_0_24px_oklch(0.78_0.17_72/0.15)]">
              <canvas ref={canvasRef} style={{ display: "block" }} />
            </div>
            <p className="text-xs text-muted-foreground font-ui text-center max-w-[200px]">
              Scan to open this page on another device
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              data-ocid="share.copy.button"
              className={cn(
                "gap-1.5 font-ui font-semibold transition-all duration-200",
                copied
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30",
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
