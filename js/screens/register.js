'use strict';

/* ============================================================
   REGISTER SCREENS
   ============================================================ */
R.register({
  login: renderLogin, signup: renderSignup, reset: renderReset,
  history: renderHistory,
  profile: renderProfile, settings: renderSettings, notifications: renderNotifications, 'contact-add': renderContactAdd,
  devices: renderDevices, sessions: renderSessions, privacy: renderPrivacy, help: renderHelp, about: renderAbout,
  'country-select': renderCountrySelect,
  'tx-amount': renderTxAmount, 'tx-review': renderTxReview, processing: renderProcessing, receipt: renderReceipt,
  services: renderServices, crypto: renderCryptoPortfolio, 'crypto-market': renderCryptoMarket, 'crypto-networks': renderCryptoNetworks,
  'crypto-spot': renderCryptoSpot,
  'crypto-buy': renderCryptoBuy, 'crypto-buy-amount': renderCryptoBuyAmount,
  'crypto-sell': renderCryptoSell, 'crypto-sell-amount': renderCryptoSellAmount,
  'crypto-swap': renderCryptoSwap, 'crypto-swap-to': renderCryptoSwapTo, 'crypto-swap-amount': renderCryptoSwapAmount,
  'crypto-send': renderCryptoSend, 'crypto-send-network': renderCryptoSendNetwork, 'crypto-send-address': renderCryptoSendAddress, 'crypto-send-amount': renderCryptoSendAmount,
  'crypto-review': renderCryptoReview,
  'crypto-receive': renderCryptoReceive, 'crypto-receive-address': renderCryptoReceiveAddress,
  chain: renderChain,
  banks: renderBanks, 'banks-add': renderBankAdd,
  'crypto-to-bank': renderCryptoToBank, 'crypto-to-bank-account': renderCryptoBankAccount,
  'crypto-to-bank-amount': renderCryptoBankAmount, 'crypto-bank-review': renderCryptoBankReview
});

