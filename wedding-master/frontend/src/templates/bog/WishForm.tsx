import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { useLang } from "../../context/LanguageContext";

interface WishFormProps {
  submitWish: (name: string, message: string) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
}

export function WishForm({ submitWish, submitting, error }: WishFormProps) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await submitWish(name.trim(), message.trim());
    if (ok) {
      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <motion.form
      onSubmit={(e: FormEvent) => void handleSubmit(e)}
      className="max-w-lg mx-auto mt-8 flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.3 }}
    >
      <Input
        id="wish-name"
        label={t("Ismingiz")}
        placeholder={t("Ism Familiya")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Textarea
        id="wish-message"
        label={t("Tilak")}
        placeholder={t("Eng chiroyli tilaklaringizni yozing...")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm text-red-600 font-body text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {t(error)}
          </motion.p>
        )}
        {submitted && (
          <motion.p
            className="text-sm text-forest font-body text-center font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
          >
            {t("Tilakingiz qabul qilindi!")} ✦
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex justify-center mt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("Yuborilmoqda...") : t("Tilak qoldiring")}
        </Button>
      </div>
    </motion.form>
  );
}
