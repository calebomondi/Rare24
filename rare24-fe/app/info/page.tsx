"use client"

import { MessageCircleQuestionMark, FileText, AlertCircle, ImageOff, Coins, Clock, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"

export default function TermsOfUsePage() {
  const lastUpdated = "December 19, 2025"
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const { theme } = useTheme()

  const toggleAccordion = (value: string) => {
    setOpenAccordion(openAccordion === value ? null : value)
  }

  return (
    <div className={`min-h-screen my-16`}>
      {/* Main Content */}
      <main className="container max-w-4xl px-4 py-8">
        {/* Title Section */}
        <div className="mb-8 space-y-4 dark:text-gray-300 text-gray-700">
          <div className="inline-flex items-center gap-2 rounded-full dark:bg-gray-500/10 bg-gray-500/30 px-4 py-1.5">
            <FileText className="h-4 w-4" />
            <span className="text-lg font-medium">Legal Document</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">Terms of Use</h1>
          <p className="text-lg leading-relaxed">
            Please read these terms carefully before using Rare24. By accessing or using our service, you
            agree to be bound by these terms and our fee structure.
          </p>
          <div className="flex items-center gap-2 text-md">
            <AlertCircle className="" size={25} />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>

        {/* Quick Overview Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3 dark:text-gray-300 text-gray-700">
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ImageOff className="text-primary" size={30} />
            </div>
            <h3 className="mb-1 text-2xl font-semibold">Content Policy</h3>
            <p className="text-lg text-muted-foreground">Prohibited content guidelines</p>
          </div>
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Coins className="text-primary" size={30} />
            </div>
            <h3 className="mb-1 text-2xl font-semibold">Platform Fees</h3>
            <p className="text-lg text-muted-foreground">Transparent pricing structure</p>
          </div>
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="text-primary" size={30} />
            </div>
            <h3 className="mb-1 text-2xl font-semibold">Time Limits</h3>
            <p className="text-lg text-muted-foreground">24-hour posts, 7-day listings & offers</p>
          </div>
        </div>

        {/* Main Terms Content */}
        <div className="space-y-6 dark:text-gray-300 text-gray-700">
          {/* Content Policy Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">1. Content Policy</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p className="font-medium text-foreground">Prohibited Content</p>
              <p>
                To maintain a safe and respectful community, users are strictly prohibited from posting the following
                types of content:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Nude or sexually explicit images</li>
                <li>Graphic violence or horrific photos</li>
                <li>Content that violates intellectual property rights</li>
                <li>Hateful, abusive, or discriminatory content</li>
                <li>Misleading or fraudulent material</li>
              </ul>
              <p className="text-lg">
                Violation of this policy may result in immediate account suspension or termination without prior notice.
              </p>
            </div>
          </div>

          {/* Posting Limitations Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">2. Posting Limitations</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p className="font-medium text-foreground">How Posting Works</p>
              <ul className="list-disc space-y-3 pl-6">
                <li>
                  <span className="font-medium text-foreground">24-Hour Posts:</span> All posts are active for only 24
                  hours before automatically disappearing from the platform
                </li>
                <li>
                  <span className="font-medium text-foreground">One Post Per Day:</span> Each account is limited to one
                  post every 24 hours
                </li>
                <li>
                  <span className="font-medium text-foreground">Mint Limit:</span> The maximum number of NFT mints
                  available for each post is equal to the number of followers the creator has at the time of posting
                </li>
              </ul>
            </div>
          </div>

          {/* NFT Minting & Primary Sales Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">3. NFT Minting & Primary Sales</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p className="font-medium text-foreground">Revenue Distribution for Initial Sales</p>
              <p>When NFTs are minted from a post, the sale proceeds are distributed as follows:</p>
              <div className="my-4 rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 bg-muted/50 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Creator</span>
                    <span className="text-lg font-bold text-primary">70%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Platform Fee</span>
                    <span className="text-lg font-bold text-primary">30%</span>
                  </div>
                </div>
              </div>
              <p className="text-lg">
                This split applies to all initial NFT mints purchased directly from the creator's post. Funds are directly sent to the creator wallet used to share the post upon minting.
              </p>
            </div>
          </div>

          {/* Secondary Sales & Royalties Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">4. Secondary Sales & Royalties</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p className="font-medium text-foreground">Revenue Distribution for Resales</p>
              <p>When an NFT is resold on the secondary market, the sale proceeds are distributed as follows:</p>
              <div className="my-4 rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 bg-muted/50 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Seller</span>
                    <span className="text-lg font-bold text-primary">85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Original Creator (Royalty)</span>
                    <span className="text-lg font-bold text-primary">10%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Platform Fee</span>
                    <span className="text-lg font-bold text-primary">5%</span>
                  </div>
                </div>
              </div>
              <p className="text-lg">
                Creator royalties ensure that original artists continue to benefit from their work's success in the
                secondary market.
              </p>
            </div>
          </div>

          {/* Buy Offers Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">5. Buy Offers</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p className="font-medium text-foreground">How Buy Offers Work</p>
              <ul className="list-disc space-y-3 pl-6">
                <li>
                  <span className="font-medium text-foreground">Deposit Requirement:</span> When making a buy offer for
                  an NFT, you must deposit the exact amount you are offering
                </li>
                <li>
                  <span className="font-medium text-foreground">7-Day Window:</span> Your offer will remain active for 7
                  days
                </li>
                <li>
                  <span className="font-medium text-foreground">Refund:</span> You can cancel an offer anytime if its not accepted and you deposit will be refunded automatically. If the offer is not accepted
                  within the 7-day period, you can manually refund your deposits to your account
                </li>
                <li>
                  <span className="font-medium text-foreground">Instant Settlement:</span> If the seller accepts your
                  offer, the NFT transfer and payment occur immediately
                </li>
              </ul>
            </div>
          </div>

          {/* NFT Listings for Sale Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">6. NFT Listings for Sale</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p className="font-medium text-foreground">Listing Duration</p>
              <ul className="list-disc space-y-3 pl-6">
                <li>
                  <span className="font-medium text-foreground">7-Day Active Period:</span> When you list an NFT for
                  sale, the listing will remain active for 7 days
                </li>
                <li>
                  <span className="font-medium text-foreground">Automatic Expiration:</span> After 7 days, if the NFT
                  has not been sold, the listing will automatically expire
                </li>
                <li>
                  <span className="font-medium text-foreground">Relisting:</span> You can create a new listing at any
                  time, with a new 7-day period
                </li>
                <li>
                  <span className="font-medium text-foreground">Price Changes:</span> To change the price, you must
                  cancel the current listing and create a new one
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <h2 className="mb-4 text-2xl font-bold">Additional Terms</h2>
            <div className="w-full">
              {/* Account Responsibilities */}
              <div className="border-b border-gray-500/50">
                <button
                  onClick={() => toggleAccordion("account")}
                  className="flex w-full items-center justify-between py-4 text-left text-xl font-medium transition-all hover:underline"
                >
                  Account Responsibilities
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      openAccordion === "account" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "account" && (
                  <div className="pb-4 pt-0 text-lg leading-relaxed">
                    <p className="mb-3">
                      You are responsible for maintaining the security of your account and wallet. You must:
                    </p>
                    <ul className="list-disc space-y-2 pl-6">
                      <li>Keep your password and private keys secure</li>
                      <li>Not share your account credentials with others</li>
                      <li>Notify us immediately of any unauthorized access</li>
                      <li>Ensure all content you post complies with our content policy</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Intellectual Property */}
              <div className="border-b border-gray-500/50">
                <button
                  onClick={() => toggleAccordion("intellectual")}
                  className="flex w-full items-center justify-between py-4 text-left text-xl font-medium transition-all hover:underline"
                >
                  Intellectual Property & NFT Ownership
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      openAccordion === "intellectual" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "intellectual" && (
                  <div className="pb-4 pt-0 text-lg leading-relaxed">
                    <p className="mb-3">
                      When you mint an NFT, you retain copyright to your original content. NFT purchasers receive:
                    </p>
                    <ul className="list-disc space-y-2 pl-6">
                      <li>Ownership of the unique digital token</li>
                      <li>Right to display, sell, or transfer the NFT</li>
                      <li>Personal, non-commercial use rights to the associated content</li>
                    </ul>
                    <p className="mt-3">
                      You warrant that you own or have rights to all content you post. Posting content you don't have
                      rights to may result in account termination and legal action.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment & Wallet Terms */}
              <div className="border-b border-gray-500/50">
                <button
                  onClick={() => toggleAccordion("payments")}
                  className="flex w-full items-center justify-between py-4 text-left text-xl font-medium transition-all hover:underline"
                >
                  Payment & Wallet Terms
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      openAccordion === "payments" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "payments" && (
                  <div className="pb-4 pt-0 text-muted-foreground text-lg leading-relaxed">
                    <p className="mb-3">
                      All transactions are conducted using cryptocurrency. By using our platform, you acknowledge:
                    </p>
                    <ul className="list-disc space-y-2 pl-6">
                      <li>Cryptocurrency transactions are irreversible</li>
                      <li>You are responsible for all transaction fees (gas fees)</li>
                      <li>Platform fees are automatically deducted from sale proceeds</li>
                      <li>Refunds are only available for expired buy offers</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Limitation of Liability */}
              <div className="border-b border-gray-500/50">
                <button
                  onClick={() => toggleAccordion("liability")}
                  className="flex w-full items-center justify-between py-4 text-left text-xl font-medium transition-all hover:underline"
                >
                  Limitation of Liability
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      openAccordion === "liability" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "liability" && (
                  <div className="pb-4 pt-0 text-lg leading-relaxed">
                    <p>
                      We are not liable for any losses related to cryptocurrency value fluctuations, blockchain network
                      issues, wallet security breaches, or disputes between users. NFT values can decrease, and past
                      performance does not guarantee future results. Trade at your own risk.
                    </p>
                  </div>
                )}
              </div>

              {/* Account Termination */}
              <div>
                <button
                  onClick={() => toggleAccordion("termination")}
                  className="flex w-full items-center justify-between py-4 text-left text-xl font-medium transition-all hover:underline"
                >
                  Account Termination
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      openAccordion === "termination" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordion === "termination" && (
                  <div className="pb-4 pt-0 text-lg leading-relaxed">
                    <p className="mb-3">We may immediately suspend or terminate your account for:</p>
                    <ul className="list-disc space-y-2 pl-6">
                      <li>Posting prohibited content</li>
                      <li>Fraudulent activity or scam attempts</li>
                      <li>Harassment or abusive behavior</li>
                      <li>Violating any terms outlined in this agreement</li>
                    </ul>
                    <p className="mt-3">
                      Upon termination, you retain ownership of your minted NFTs, but lose access to the platform and
                      any pending offers or listings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="rounded-lg shadow-lg shadow-gray-500/20 dark:shadow-gray-300/10 dark:shadow-md dark:shadow-gray-300 p-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageCircleQuestionMark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-xl">Questions About These Terms?</h3>
                <p className="mb-3 text-lg text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms of Use, please don't hesitate to contact us on our socials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-lg dark:text-gray-300 text-gray-700">
          <p>By using our service, you acknowledge that you have read and understood these Terms of Use.</p>
        </div>
      </main>
    </div>
  )
}
