function _typeof(e) {
	return (_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
		return typeof e
	} : function (e) {
		return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
	})(e)
}! function (e, n) {
	"use strict";
	var t = e.module("snwChangeAddress", ["snwCore", "snwSwal", "snwLockr"]);
	t.controller("ChangeAddressController", ["$http", "$q", "$swal", "$rootScope", "ValueCleanerService", "RedirectResponse", "SNW_BASE_URL", "LocateService", function (e, n, t, r, o, i, a, s) {
		this.changeAddress = function () {
			t.prompt("Informe um novo CEP", "Trocar o endereço", {
				inputPlaceholder: "00000-000"
			}).then(function (t) {
				return t = o.digitsOnly(t), /^\d{8}$/.test(t) ? e.post([a, "api/v2/stores/locate"].join("/"), {
					postal_code: t,
					abort_on_empty: !0
				}) : n.reject({
					status: 422
				})
			}).then(function (e) {
				return e.data && !e.data.has_store ? n.reject({
					status: 404
				}) : e
			}).then(function (e) {
				return s.setResponse(e), e
			}).then(i(a)).catch(function (e) {
				var n;
				return e && 422 === e.status ? t.error("Verifique se você digitou o CEP corretamente", "CEP inválido") : e && 404 === e.status ? t.info("Ainda não atendemos o CEP que você buscou.", "Estamos chegando") : e && 406 === e.status ? (n = e.data.errors.map(function (e) {
					return e.message
				}).join(" \n "), t.error("", n, {
					reject: !0
				})) : !1 !== e ? t.error("Por favor tente novamente", "Houve um erro ao alterar o CEP") : void 0
			})
		}, r.$on("snw:address-change", function () {
			"/mercados" === window.location.pathname && window.location.reload()
		})
	}]), t.service("LocateService", ["snwLockrService", "POSTAL_CODE_LOCAL_STORAGE_KEY", "ADDRESS_ID_LOCAL_STORAGE_KEY", "ADDRESS_NAME_LOCAL_STORAGE_KEY", function (n, t, r, o) {
		var i = 0,
			a = void 0,
			s = void 0;

		function c(e) {
			e > 0 && n.set(r, e)
		}
		return {
			setResponse: function (e) {
				e.data && e.data.address && e.data.address.postal_code && (a = e.data.address.postal_code, n.set(t, a || "")), e.data && e.data.address && e.data.address.id && (c(i = (i = +e.data.address.id) == i ? i : 0), s = "Inserir endereço de entrega", e.data.address.street_name && (s = e.data.address.street_name), e.data.address.street_number && (s = s + ", " + e.data.address.street_number), n.set(o, s || ""))
			},
			setAddressId: c,
			getPostalCode: function (n) {
				return e.isDefined(a) ? a : e.isDefined(n) ? n : ""
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwIugu", ["snwCreditCard", "snwLogErrors"]),
		r = function (n) {
			var t = {},
				r = [];
			return e.forEach(n, function (e, n) {
				switch (n) {
					case "transaction":
						t.transaction = !0;
						break;
					case "brand":
						t.brand = !0;
						break;
					case "number":
						t.number = !0;
						break;
					case "verification_value":
						t.csc = !0;
						break;
					case "expiration":
					case "expiration_month":
					case "expiration_year":
					case "month":
					case "year":
						t.expiration = !0;
						break;
					case "first_name":
					case "last_name":
					case "full_name":
						t.name = !0;
						break;
					default:
						t[n] = !0
				}
				return !0
			}), t.firstName && r.push(t.firstName), t.lastName && r.push(t.lastName), r.length && (t.fullName = !0), Object.keys(t)
		};
	t.provider("snwIuguService", [function () {
		var e = this;
		e.boot = function (e, n) {
			void 0 !== window.Iugu && (Iugu.setAccountID(e), Iugu.setTestMode(!!n), Iugu.setup())
		}, e.$get = ["$q", "CardBrandConstants", "CreditCardHelperService", "LogErrors", function (n, t, o, i) {
			return {
				requestToken: function (e, a, s, c, u) {
					var d = n.defer();
					if (void 0 === window.Iugu) return d.reject({
						status: 404,
						data: "Não foi possível carregar o JS do Iugu"
					}), d.promise;
					if (!o.isCardAccepted(a, [t.REGEX_MASTERCARD, t.REGEX_VISA, t.REGEX_AMEX, t.REGEX_ELO, t.REGEX_DINERS])) return i.tokenizationErrors("iugu", "credit-card-not-accepted"), d.reject(["credit-card-not-accepted"]), d.promise;
					var l = Iugu.utils.getFirstLastNameByFullName(e) || [],
						p = Iugu.CreditCard(a, s, c, l.shift(), l.pop(), u);
					return p.valid() ? (Iugu.createPaymentToken(p, function (e) {
						if (e.errors) return i.tokenizationErrors("iugu", e), d.reject(r(e.errors)), d.promise;
						if (!e.id || !e.extra_info) return d.reject(r({
							transaction: "invalid"
						})), d.promise;
						var n = {
							token: e.id,
							brand: e.extra_info.brand,
							name: e.extra_info.holder_name,
							number: e.extra_info.display_number,
							expirationMonth: s,
							expirationYear: c
						};
						return d.resolve(n), d.promise
					}), d.promise) : (i.tokenizationErrors("iugu", p.errors()), d.reject(r(p.errors())), d.promise)
				},
				tokenName: "iugu_token",
				serviceName: "iugu",
				boot: e.boot
			}
		}]
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwStripe", ["snwCreditCard", "snwLogErrors"]);
	t.provider("snwStripeService", [function () {
		var n = this;
		n.boot = function (e) {
			void 0 !== window.Stripe && Stripe.setPublishableKey(e)
		}, n.$get = ["$q", "CardBrandConstants", "CreditCardHelperService", "LogErrors", function (t, r, o, i) {
			return {
				requestToken: function (n, a, s, c, u, d) {
					var l = t.defer();
					if (void 0 === window.Stripe) return l.reject({
						status: 404,
						data: "Não foi possível carregar o JS do Stripe"
					}), l.promise;
					if (!o.isCardAccepted(a, [r.REGEX_MASTERCARD, r.REGEX_VISA, r.REGEX_DISCOVER, r.REGEX_DINERS])) return i.tokenizationErrors("stripe", "credit-card-not-accepted"), l.reject(["credit-card-not-accepted"]), l.promise;
					var p = function (e, n, t, r, o) {
						var i = [];
						return ("" + e).trim() || i.push("name"), Stripe.card.validateCardNumber(n) || i.push("number"), "Unknown" === Stripe.card.cardType(n) && i.push("brand"), Stripe.card.validateExpiry(t, r) || i.push("expiration"), Stripe.card.validateCVC(o) || i.push("csc"), i.length ? {
							errors: i
						} : {
							name: e,
							number: n,
							cvc: o,
							exp_month: t,
							exp_year: r
						}
					}(n, a, s, c, u);
					return e.isDefined(p.errors) ? (i.tokenizationErrors("stripe", p), l.reject(p.errors), l.promise) : (Stripe.card.createToken(p, function (e, n) {
						if (e > 299 || n.error || !n.id) return i.tokenizationErrors("stripe", n), l.reject(["transaction"]), l.promise;
						l.resolve({
							brand: n.card.brand,
							name: n.card.name,
							number: n.card.last4,
							expirationMonth: n.card.exp_month,
							expirationYear: n.card.exp_year,
							token: n.id
						})
					}), l.promise)
				},
				tokenName: "stripe_token",
				serviceName: "stripe",
				boot: n.boot
			}
		}]
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwZoop", ["snwCreditCard", "snwLogErrors"]),
		r = function (n) {
			var t = [];
			if (!e.isObject(n) || !n.error || !n.error.category) return ["transaction"];
			switch (n.error.category) {
				case "transaction":
					t.transaction = !0;
					break;
				case "invalid_card_number":
					t.number = !0;
					break;
				case "expired_card_error":
				case "invalid_expiry_month":
				case "invalid_expiry_year":
					t.expiration = !0;
					break;
				default:
					t.transaction = !0
			}
			return Object.keys(t)
		};
	t.provider("snwZoopService", [function () {
		var e, n, t = this;
		t.boot = function (t, r) {
			e = t, n = r
		}, t.$get = ["$q", "$http", "CardBrandConstants", "CreditCardHelperService", "LogErrors", function (o, i, a, s, c) {
			return {
				requestToken: function (t, u, d, l, p, f) {
					var m = o.defer();
					if (!s.isCardAccepted(u, [a.REGEX_MASTERCARD, a.REGEX_HIPERCARD, a.REGEX_DISCOVER, a.REGEX_DINERS, a.REGEX_VISA, a.REGEX_AMEX, a.REGEX_AURA, a.REGEX_JCB])) return c.tokenizationErrors("zoop", "credit-card-not-accepted"), m.reject(["credit-card-not-accepted"]), m.promise;
					var g = {
						holder_name: t,
						card_number: u,
						security_code: p,
						expiration_month: d,
						expiration_year: l
					};
					return i.post([n, "cards/tokens"].join("/"), g, {
						headers: {
							Authorization: e
						}
					}).then(function (e) {
						if (!e.data.id || !e.data.card) return c.tokenizationErrors("zoop", e), m.reject(r({
							transaction: "invalid"
						})), m.promise;
						var n = {
							token: e.data.id,
							brand: e.data.card.card_brand,
							name: e.data.card.holder_name,
							number: u,
							expirationMonth: e.data.card.expiration_month,
							expirationYear: e.data.card.expiration_year
						};
						return m.resolve(n), m.promise
					}).catch(function (e) {
						return c.tokenizationErrors("zoop", e), m.reject(r(e.data)), m.promise
					}), m.promise
				},
				tokenName: "zoop_token",
				serviceName: "zoop",
				boot: t.boot
			}
		}]
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwConductor", ["snwCreditCard", "snwLogErrors"]);
	t.provider("snwConductorService", [function () {
		var n, t, r = this;
		r.boot = function (e, r) {
			n = e, t = r
		}, r.$get = ["$q", "$http", "CardBrandConstants", "CreditCardHelperService", "LogErrors", function (o, i, a, s, c) {
			return {
				requestToken: function (r, u, d, l, p, f) {
					var m = o.defer();
					if (!s.isCardAccepted(u, [a.REGEX_CONFIANCA])) return c.tokenizationErrors("conductor", "credit-card-not-accepted"), m.reject(["credit-card-not-accepted"]), m.promise;
					var g = JSON.stringify({
						cpf: f,
						nomeImpresso: r,
						numeroCartao: u,
						validade: "011900"
					});
					return i.post([t, "web-token-api/api/tokenizar"].join("/"), g, {
						headers: {
							"Content-Type": "application/json",
							access_token: n
						}
					}).then(function (e) {
						var n = {
							token: e.data.tokenCartao + "-" + e.data.tokenPortador,
							brand: "confianca",
							name: r,
							number: u,
							expirationMonth: d,
							expirationYear: l
						};
						return m.resolve(n), m.promise
					}).catch(function (n) {
						var t;
						return c.tokenizationErrors("conductor", n), m.reject((t = n.data, e.isObject(t) && t.mensagens ? "Nome impresso inválido." === t.mensagens[0] ? ["name"] : "CPF não corrensponde ao portador do cartão." === t.mensagens[0] ? ["cpf"] : "[CARDS-API] Cartão não encontrado." === t.mensagens[0] ? ["number"] : null !== t.mensagens[0] ? ["transaction"] : [JSON.stringify(t.mensagens)] : ["transaction"])), m.promise
					}), m.promise
				},
				tokenName: "conductor_token",
				serviceName: "conductor",
				boot: r.boot
			}
		}]
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwAdyen", ["snwCreditCard", "snwLogErrors"]);
	t.provider("snwAdyenService", [function () {
		var n, t = this;
		t.boot = function (e) {
			n = e
		}, t.$get = ["$q", "CardBrandConstants", "CreditCardHelperService", "LogErrors", function (r, o, i, a) {
			return {
				requestToken: function (t, s, c, u, d, l) {
					var p = r.defer();
					if (void 0 === window.adyen) return p.reject({
						status: 404,
						data: "Não foi possível carregar o JS da Adyen"
					}), p.promise;
					if (!i.isCardAccepted(s, [o.REGEX_MASTERCARD, o.REGEX_HIPERCARD, o.REGEX_VISA, o.REGEX_AMEX, o.REGEX_ELO])) return a.tokenizationErrors("adyen", "credit-card-not-accepted"), p.reject(["credit-card-not-accepted"]), p.promise;
					var f = function (e, n, t, r, o) {
						var i = [];
						return ("" + e).trim() || i.push("name"), i.length ? {
							errors: i
						} : {
							name: e,
							number: n,
							cvc: o,
							exp_month: t,
							exp_year: r
						}
					}(t, s, c, u, d);
					if (e.isDefined(f.errors)) return a.tokenizationErrors("adyen", f), p.reject(f.errors), p.promise;
					var m = (new Date).toISOString(),
						g = adyen.encrypt.createEncryption(n, {}),
						v = {
							token: {
								cvc: g.encrypt({
									cvc: d,
									generationtime: m
								}),
								number: g.encrypt({
									number: f.number,
									generationtime: m
								}),
								expiryYear: g.encrypt({
									expiryYear: u.toString(),
									generationtime: m
								}),
								expiryMonth: g.encrypt({
									expiryMonth: c,
									generationtime: m
								}),
								holderName: g.encrypt({
									holderName: t,
									generationtime: m
								})
							},
							brand: i.cardBrand(s),
							name: t,
							number: s,
							expirationMonth: c,
							expirationYear: u
						};
					return p.resolve(v), p.promise
				},
				tokenName: "adyen_token",
				serviceName: "adyen",
				boot: t.boot
			}
		}]
	}])
}(window.angular),
function (e, n) {
	"use strict";
	e.module("snwPaymentTokenizer", ["snwCore", "snwIugu", "snwStripe", "snwZoop", "snwConductor", "snwAdyen", "snwLog"]).service("PaymentGatewayService", ["$q", "$http", "ValueCleanerService", "snwStripeService", "snwIuguService", "snwZoopService", "snwConductorService", "snwAdyenService", "LogService", "SNW_BASE_URL", function (n, t, r, o, i, a, s, c, u, d) {
		return {
			requestToken: function (l, p, f, m, g, v) {
				var h = {};
				p = r.digitsOnly(p, ""), 2 === m.toString().length && (m = parseInt("20" + m));
				var w = {
						brand: "unknown",
						name: l,
						number: p.slice(-4),
						bin_number: p.slice(0, 6),
						maturity_month: f,
						maturity_year: m
					},
					_ = function (n) {
						var t = null;
						return e.forEach(n, function (e, n) {
							var r = h[n];
							w[r.tokenName] = !1, t = e, e.status && 404 === e.status && u.sendAlerts("Payment Gateway", e.data)
						}), t
					};
				h[o.serviceName] = o, h[i.serviceName] = i, h[a.serviceName] = a, h[s.serviceName] = s, h[c.serviceName] = c;
				var C = function (n, t, r, o, i, a, s) {
					var c = {};
					return e.forEach(n, function (e, n) {
						c[n] = e.requestToken(t, r, o, i, a, s)
					}), c
				}(h, l, p, f, m, g, v);
				return n.any(C).then(function (n) {
					return n.resolved && e.forEach(n.resolved, function (e, n) {
						var t = h[n];
						w[t.tokenName] = e.token, w.brand = e.brand
					}), n.rejected && _(n.rejected), w
				}, function (e) {
					if (e.rejected) return n.reject(_(e.rejected), t.post([d, "api/v2/current-user/tokenization-tries"].join("/")))
				})
			},
			canTokenize: function (e) {
				return t.get([d, "api/v2/current-user/can-tokenize"].join("/"), {
					params: {
						brand: e
					}
				})
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = window.angular.module("snwCreditCard", []);
	t.constant("CardBrandConstants", {
		REGEX_VISA: "^4(?!389|514|011|576)\\d*$",
		REGEX_MASTERCARD: "^(5[1-5]|222[1-9]|2[3-6]|27[0-1]|2720|677189)\\d*$",
		REGEX_AMEX: "^3[47]\\d*$",
		REGEX_ELO: "^(636368|636760|438935|431274|504175|451416|36297|636297|506(699|7[0-6][0-9]|77[0-8])|4576|4011|509|457393|45763[1-2]|627780|636297|65003[1-3]|6500(3[5-9]|4[0-9]|5[0-1])|6504(0[5-9]|[1-3][0-9])|650(4[8-9][0-9]|5[0-2][0-9]|53[0-8])|6505(4[1-9]|[5-8][0-9]|9[0-8])|6507(0[0-9]|1[0-8])|65072[0-7]|6509(0[1-9]|1[0-9]|20)|6516(5[2-9]|[6-7][0-9])|6550([0-1][0-9]|2[1-9]|[3-4][0-9]|5[0-8])|7)\\d*$",
		REGEX_DINERS: "^3(0[0-5]|[68])\\d*$",
		REGEX_DISCOVER: "^(6011|622|65|64[4-9])\\d*$",
		REGEX_JCB: "(?:2131|1800|35\\d{3})\\d{11}",
		REGEX_AURA: "^(5078\\d{2})(\\d{2})(\\d{11})$",
		REGEX_HIPERCARD: "^(606282\\d{10}(\\d{3})?)|(3841\\d{15})$",
		REGEX_CONFIANCA: "^(607996\\d{10})|(9000(0[0-9]|1[0-4]|21|22|31|41)\\d{10})$"
	}), t.service("CreditCardHelperService", ["CardBrandConstants", function (e) {
		return {
			isCardAccepted: function (e, n) {
				for (var t = 0; t < n.length; t++)
					if (new RegExp(n[t]).test(e)) return !0;
				return !1
			},
			cardBrand: function (n) {
				for (var t = [{
						brand: "Visa",
						pattern: e.REGEX_VISA
					}, {
						brand: "Mastercard",
						pattern: e.REGEX_MASTERCARD
					}, {
						brand: "Amex",
						pattern: e.REGEX_AMEX
					}, {
						brand: "Elo",
						pattern: e.REGEX_ELO
					}, {
						brand: "Diners",
						pattern: e.REGEX_DINERS
					}, {
						brand: "Discover",
						pattern: e.REGEX_DISCOVER
					}, {
						brand: "JCB",
						pattern: e.REGEX_JCB
					}, {
						brand: "Aura",
						pattern: e.REGEX_AURA
					}, {
						brand: "Hipercard",
						pattern: e.REGEX_HIPERCARD
					}, {
						brand: "Confianca",
						pattern: e.REGEX_CONFIANCA
					}], r = 0; r < t.length; r++)
					if (new RegExp(t[r].pattern).test(n)) return t[r].brand;
				return null
			}
		}
	}])
}(),
function (e, n) {
	"use strict";
	var t = window.angular.module("snwUserHelper", []);
	t.constant("USER_TYPE", {
		INDIVIDUAL: 1,
		COMPANY: 2
	}), t.service("UserService", ["USER_TYPE", function (e) {
		return {
			cleanUserByType: function (n) {
				return parseInt(n.lookup_user_type_id) === e.COMPANY && (n.birthday = null, n.last_name = "", n.sex = null), n
			},
			isIndividual: function (n) {
				return parseInt(n.lookup_user_type_id) === e.INDIVIDUAL
			},
			isCompany: function (n) {
				return parseInt(n.lookup_user_type_id) === e.COMPANY
			}
		}
	}])
}(),
function (e, n) {
	"use strict";
	var t = e.module("snwModal", []);
	t.constant("SNW_TOGGLE_MODAL_EVENT", "snw:toggle-modal");
	var r = function (n, t, r, o, i, a, s, c) {
		var u, d, l, p = this,
			f = e.element(o[0].querySelector("body")),
			m = e.element('<div class="modal-backdrop fade"></div>');
		p.visible = p.visible || !1;
		var g = null,
			v = function (e) {
				e.clickedInDialog = !0
			},
			h = function (e) {
				if (!e.clickedInDialog) {
					if ($(e.target).closest(".modal-dialog").length || $(e.target).closest(".close").length) return;
					p.close()
				}
			},
			w = function (e) {
				27 === e.keyCode && n.$apply(p.close())
			},
			_ = function () {
				p.visible = !1, f.off("keyup", w), g && (g.off("click", v), t.off("click", h)), i.cancel(l), l = i(function () {
					t.removeClass("in"), m.removeClass("in")
				}).then(function () {
					return i(150)
				}).then(function () {
					m.detach(), t.css("display", "none"), f.removeClass("modal-open"), t.detach()
				})
			};
		p.toggleModal = function () {
			p.visible = !p.visible
		}, p.close = function () {
			p.visible && p.discardAlert ? a.message("Se você fechar, os dados preenchidos serão perdidos. Deseja descartar?", "Atenção", {
				showCancelButton: !0,
				html: !0,
				confirmButtonText: "Sim, descartar todos",
				cancelButtonText: "Não, completar cadastro",
				imageSize: "110x110",
				imageUrl: "/images/common/card/img-popup-sadface.svg"
			}).then(function () {
				_()
			}) : _()
		}, p.back = function () {
			s.broadcast("MODAL_BACK")
		}, u = n.$watch("modalCtrl.visible", function (e) {
			e ? (p.visible = !0, f.addClass("modal-open"), f.append(m), f.append(t), t.css("display", "block"), f.on("keyup", w), g && (g.on("click", v), t.on("click", h)), i.cancel(l), l = i(function () {
				m.addClass("in"), t.addClass("in")
			}, 150)) : _()
		}), d = n.$on("snw:toggle-modal", p.toggleModal), n.$applyAsync(function () {
			t.detach(), m.detach(), p.clickToClose && (g = t.children().eq(0))
		}), n.$on("$destroy", function () {
			f.off("keyup", w), g && (t.off("click", h), g.off("click", v), g = null), i.cancel(l), e.isFunction(u) && (u(), u = null), e.isFunction(d) && (d(), d = null)
		})
	};
	r.$inject = ["$scope", "$element", "$attrs", "$document", "$timeout", "$swal", "BroadcastService", "$rootScope"], t.directive("snwModal", [function () {
		return {
			restrict: "C",
			transclude: !0,
			replace: !0,
			scope: {
				title: "@",
				visible: "=?",
				clickToClose: "<?",
				backButton: "<?",
				discardAlert: "<?"
			},
			controller: r,
			controllerAs: "modalCtrl",
			bindToController: !0,
			template: '<div class="modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" ng-click="modalCtrl.close()"><img src="/images/common/icon-close.svg" style="width: 25px"></button><button type="button" class="close" ng-if="modalCtrl.backButton" style="float:left" ng-click="modalCtrl.back()"><img src="/images/common/icon-arrow-left-orange.svg" style="width: 25px"></button><h4 class="modal-title"><strong>{{ modalCtrl.title }}</strong></h4></div><div class="modal-body" ng-transclude></div></div></div></div>'
		}
	}]), t.directive("snwModalProduct", [function () {
		return {
			restrict: "C",
			transclude: !0,
			replace: !0,
			scope: {
				title: "@",
				visible: "=?",
				clickToClose: "<?",
				discardAlert: "<?"
			},
			controller: r,
			controllerAs: "modalCtrl",
			bindToController: !0,
			template: '<div class="modal fade"><div class="modal-dialog"><div class="modal-content"><button type="button" class="close" ng-click="modalCtrl.close()">&times;</button><div class="modal-body" ng-transclude></div></div></div></div>'
		}
	}])
}(window.angular),
function (e) {
	"use strict";
	window.angular.module("snwIOSScrollTop", []).run(["$window", "$document", "$rootScope", function (e, n, t) {
		var r = n[0],
			o = /iPad|iPhone|iPod/.test(e.navigator.userAgent) && !e.MSStream;
		t.iOSScrollTop = function (e) {
			if (!o) return !0;
			var n = r.querySelector(e);
			if (n) {
				var t = n.scrollTop;
				if (0 !== t) {
					n.style.overflow = "hidden";
					var i = t / (t < 1e3 ? 15 : 30),
						a = function () {
							n.scrollTop = 0, n.style.overflow = null
						};
					! function e() {
						n.scrollTop -= i, n.scrollTop > 0 ? setTimeout(e, 10) : a()
					}()
				}
			}
		}
	}])
}(),
function (e) {
	"use strict";
	e.module("snwLazySrc", ["snwConfig"]).directive("snwSrc", ["$window", "$document", "$rootScope", "BrowserDimensionService", "SNW_REPAINT_EVENT", function (n, t, r, o, i) {
		var a = t[0],
			s = 0,
			c = function () {
				var t, c = [],
					u = [],
					d = null,
					l = 100,
					p = e.element(n),
					f = a.documentElement.clientHeight,
					m = null,
					g = 2e3,
					v = !1;

				function h(e) {
					! function (e) {
						if (e) {
							var n = u.filter(function (n) {
								return n.identifier === e
							})[0];
							n && (n.count--, n.count < 1 && (u = u.filter(function (n) {
								return n.identifier !== e
							}), n.element.off("scroll", S), n.element = null, n = null))
						}
					}(e.container), c = c.filter(function (n) {
						return n.id !== e.id
					}), e.container = null, e = null, c.length || (s = 0, C(), E())
				}

				function w() {
					if (!d) {
						var e = a.documentElement.clientHeight;
						e !== f && (f = e, y())
					}
				}

				function _() {
					var e, n = [],
						t = o.windowDimensions();
					for (e = 0; e < c.length; e++) {
						var r = c[e];
						r.isVisible(t) && n.push(r)
					}
					for (e = 0; e < n.length; e++) n[e].render(), h(n[e]);
					n.length = 0, C()
				}

				function C() {
					clearTimeout(d), d = null
				}

				function y() {
					d = setTimeout(_, l)
				}

				function b() {
					!1 !== v && E(), v = !0, p.on("resize", S), p.on("scroll", S), setTimeout(function () {
						$(".snw-products__container").on("scroll", S)
					}, 500), t = r.$on(i, S), u.forEach(function (e) {
						e.element.on("scroll", S)
					}), m = setInterval(w, g)
				}

				function E() {
					v = !1, p.off("resize", S), p.off("scroll", S), $(".snw-products__container").off("scroll", S), e.isFunction(t) && (t(), t = null), u.forEach(function (e) {
						e.element.off("scroll", S)
					}), clearInterval(m)
				}

				function S() {
					d || y()
				}
				return {
					addImage: function (n) {
						! function (n) {
							if (n) {
								var t = u.filter(function (e) {
									return e.identifier === n
								})[0];
								if (t) t.count++;
								else {
									var r = a.querySelector(n);
									r && (u.push({
										identifier: n,
										element: e.element(r),
										count: 1
									}), b())
								}
							}
						}(n.container), c.push(n), d || y(), v || b()
					},
					removeImage: h
				}
			}();

		function u(e) {
			var n = null,
				t = !1;

			function r() {
				e.src = n
			}
			return {
				isVisible: function (n) {
					var t = o.elementDimensions(e),
						r = t.top,
						i = t.bottom,
						a = t.left,
						s = t.right,
						c = n.height,
						u = n.width;
					return (r <= c && r >= 0 || i <= c && i >= 0 || r <= 0 && i >= c) && (a <= u && a >= 0 || s <= u && s >= 0 || a <= 0 && s >= u)
				},
				render: function () {
					t = !0, n && r()
				},
				setSource: function (e) {
					n = e, t && r()
				},
				isRendered: function () {
					return t
				}
			}
		}
		return {
			restrict: "A",
			scope: {
				src: "@snwSrc",
				container: "@"
			},
			link: function (n, t, r) {
				var o, i = new u(t[0]);
				i.id = s++, i.container = !!n.container && n.container, o = r.$observe("snwSrc", function (e) {
					i.setSource(e), c.addImage(i), o()
				});
				var a = function () {
					i && i.isRendered && !i.isRendered() && (c.removeImage(i), i = null), e.isFunction(o) && (o(), o = null)
				};
				n.$on("$destroy", a), t.on("$destroy", function () {
					a(), t.off().remove(), t = null, r = null
				})
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwInputMasks", []),
		r = function (e) {
			return ("" + (e || "")).trim()
		},
		o = function (e) {
			e.bind("keyup", function () {
				var n = e[0],
					t = n.value || e.val();
				if (t)
					if (n.createTextRange) {
						var r = n.createTextRange();
						r.collapse(!0), r.moveEnd("character", t.length), r.moveStart("character", t.length), r.select()
					} else n.setSelectionRange && (n.focus(), n.setSelectionRange(t.length, t.length))
			})
		},
		i = function (e, n) {
			return function (t, o) {
				var i, a = t || o;
				return a ? (a = r(a).replace(/\D/g, ""), i = n(a), e.$viewValue !== i && (e.$setViewValue(i), e.$render()), i.replace(/\D/g, "")) : a
			}
		},
		a = function (e, n) {
			return function (t, o) {
				var i, a = t || o;
				return a ? (a = r(a), i = n(a), e.$viewValue !== i && (e.$setViewValue(i), e.$render()), i) : a
			}
		};
	t.directive("inputDecimal", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, i) {
				var s = new StringMask("#0.99", {
						reverse: !0
					}),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), i.$formatters.push(c), i.$parsers.push(a(i, c))
			}
		}
	}]), t.directive("inputWeight", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, i) {
				var s = new StringMask("#0.999", {
						reverse: !0
					}),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), i.$formatters.push(c), i.$parsers.push(a(i, c))
			}
		}
	}]), t.directive("inputNumber", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, i) {
				var s = new StringMask("#", {
						reverse: !0
					}),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), i.$formatters.push(c), i.$parsers.push(a(i, c))
			}
		}
	}]), t.directive("inputPhoneNumber", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, a) {
				var s = new StringMask("00000-0000"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), a.$formatters.push(c), a.$parsers.push(i(a, c))
			}
		}
	}]), t.directive("inputPhoneComplete", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, a) {
				var s = new StringMask("(00) 00000-0000"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), a.$formatters.push(c), a.$parsers.push(i(a, c))
			}
		}
	}]), t.directive("inputCpf", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, a) {
				var s = new StringMask("000.000.000-00"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), a.$formatters.push(c), a.$parsers.push(i(a, c))
			}
		}
	}]), t.directive("inputCnpj", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, a) {
				var s = new StringMask("00.000.000/0000-00"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), a.$formatters.push(c), a.$parsers.push(i(a, c))
			}
		}
	}]), t.directive("inputPhoneAreaCode", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, o) {
				var a = new StringMask("00"),
					s = function (e) {
						return e = r(e).replace(/\D/g, ""), a.apply(e).replace(/\D+$/, "")
					};
				o.$formatters.push(s), o.$parsers.push(i(o, s))
			}
		}
	}]), t.directive("inputCep", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, a) {
				var s = new StringMask("00000-000"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), a.$formatters.push(c), a.$parsers.push(i(a, c))
			}
		}
	}]), t.directive("inputCard", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, a, s) {
				var c, u = !1,
					d = new StringMask("0000 0000 0000 0000 000"),
					l = function (e) {
						return u ? e : (e = r(e).replace(/\D/g, ""), d.apply(e).replace(/\D+$/, ""))
					};
				o(t), s.$parsers.push(i(s, l)), n.$applyAsync(function () {
					s.$formatters.push(l)
				}), c = a.$observe("hidden", function (e) {
					u = !0 === e || "true" === e || "hidden" === e, s.$setViewValue(l(s.$viewValue)), s.$render()
				}), t.on("$destroy", function () {
					e.isFunction(c) && (c(), c = null)
				})
			}
		}
	}]), t.directive("inputCardCsc", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, o, a) {
				var s, c = new StringMask("0000"),
					u = !1,
					d = function (e) {
						return e = r(e).replace(/\D/g, ""), u ? "XXX" : c.apply(e).replace(/\D+$/, "")
					};
				a.$formatters.push(d), a.$parsers.push(i(a, d)), s = o.$observe("hidden", function (e) {
					u = !0 === e || "true" === e || "hidden" === e, a.$setViewValue(d(a.$viewValue)), a.$render()
				}), t.on("$destroy", function () {
					e.isFunction(s) && (s(), s = null)
				})
			}
		}
	}]), t.directive("inputCardExpiryDate", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, i) {
				var s = new StringMask("00/00"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), i.$formatters.push(c), i.$parsers.push(a(i, c))
			}
		}
	}]), t.directive("inputUppercase", ["ValueCleanerService", function (e) {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				var i = function (n) {
					return (n = e.clear(n, "")).toLocaleUpperCase()
				};
				o.$formatters.push(i), o.$parsers.push(a(o, i))
			}
		}
	}]), t.directive("inputBirthday", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, a) {
				var s = new StringMask("00/00/0000"),
					c = function (e) {
						return e = r(e).replace(/\D/g, ""), s.apply(e).replace(/\D+$/, "")
					};
				o(n), a.$formatters.push(c), a.$parsers.push(i(a, c))
			}
		}
	}]), t.filter("percent", [function () {
		return function (e) {
			return e.toFixed(0)
		}
	}]), t.filter("trustUrl", ["$sce", function (e) {
		return function (n) {
			return e.trustAsResourceUrl(n)
		}
	}])
}(window.angular),
function (e) {
	"use strict";
	window.angular.module("snwDownloadApp", ["snwCore", "snwLockr"]).controller("DownloadAppController", ["$scope", "$http", "$q", "$swal", "snwLockrService", "IsInvalidModel", "AddModelErrorsFromServer", "BroadcastService", "RedirectResponse", "SNW_BASE_URL", function (e, n, t, r, o, i, a, s, c, u) {
		var d = this,
			l = "SNW_SHOW_BANNER_DOWNLOAD_APP";
		d.phone = "", d.showBannerApp = !0, d.loading = !1, d.cleanForm = function () {
			d.downloadAppForm.$setPristine()
		}, d.closeBannerApp = function () {
			d.showBannerApp = !1, o.set(l, !1)
		}, d.sendDownloadLink = function () {
			return d.downloadAppForm.$invalid && d.downloadAppForm.phone_complete.$error.required ? (d.cleanForm(), r.error("O número de celular é obrigatório", "Telefone obrigatório", {
				reject: !0
			})) : d.downloadAppForm.$invalid && d.downloadAppForm.phone_complete.$error.phoneComplete ? (d.cleanForm(), r.error("Informe o telefone no formato: 00 90000-0000", "Telefone inválido", {
				reject: !0
			})) : (d.loading = !0, n.post([u, "api/send-app-link"].join("/"), {
				phone_number: d.phone
			}).then(function (e) {
				e && e.data && e.data.success ? (d.phone = "", r.success("O link foi enviado com sucesso por favor aguarde alguns minutos para recebê-lo.", "Sucesso!")) : r.error("Houve um erro no envio do link, por favor tente novamente.", "Erro!")
			}).catch(function () {
				r.error("Houve um erro no envio do link, por favor tente novamente.", "Erro!")
			}).finally(function () {
				d.loading = !1, d.downloadAppForm.$setPristine()
			}))
		}, d.showBannerApp = o.get(l, !0)
	}])
}(),
function (e) {
	"use strict";
	var n = e.module("snwInputValidators", []);
	n.directive("inputUnique", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, r) {
				r.$parsers.push(function (e) {
					return r.$setValidity("unique", !0), e
				})
			}
		}
	}]), n.directive("inputCpf", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, r) {
				r.$validators.cpf = function (e) {
					return function (n) {
						if (e.$isEmpty(n)) return !0;
						var t, r, o, i = n.replace(/\D/g, "");
						if (11 !== i.length) return !1;
						if (new RegExp("^" + i[0] + "{11}$").test(i)) return !1;
						for (t = 10, r = 0, o = 0; t >= 2; r += i[o++] * t--);
						if (i[9] != ((r %= 11) < 2 ? 0 : 11 - r)) return !1;
						for (t = 11, r = 0, o = 0; t >= 2; r += i[o++] * t--);
						return i[10] == ((r %= 11) < 2 ? 0 : 11 - r)
					}
				}(r)
			}
		}
	}]), n.directive("inputCnpj", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, r) {
				r.$validators.cnpj = function (e) {
					return function (n) {
						if (e.$isEmpty(n)) return !0;
						var t, r = n.replace(/\D/g, "");
						if (14 !== r.length) return !1;
						if (new RegExp("^" + r[0] + "{14}$").test(r)) return !1;
						if ("00000000000000" == r || "11111111111111" == r || "22222222222222" == r || "33333333333333" == r || "44444444444444" == r || "55555555555555" == r || "66666666666666" == r || "77777777777777" == r || "88888888888888" == r || "99999999999999" == r) return !1;
						var o = r.length - 2,
							i = r.substring(0, o),
							a = r.substring(o),
							s = 0,
							c = o - 7;
						for (t = o; t >= 1; t--) s += i.charAt(o - t) * c--, c < 2 && (c = 9);
						var u = s % 11 < 2 ? 0 : 11 - s % 11;
						if (u != a.charAt(0)) return !1;
						for (o += 1, i = r.substring(0, o), s = 0, c = o - 7, t = o; t >= 1; t--) s += i.charAt(o - t) * c--, c < 2 && (c = 9);
						return (u = s % 11 < 2 ? 0 : 11 - s % 11) == a.charAt(1)
					}
				}(r)
			}
		}
	}]), n.directive("inputPhoneAreaCode", [function () {
		var e = /^[1-9]\d$/;
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				o.$validators.phoneAreaCode = function (n, t) {
					return !!o.$isEmpty(n) || e.test(t)
				}
			}
		}
	}]), n.directive("inputPhoneComplete", [function () {
		var e = /^\(\d{2}\) 9\d{4}-\d{4}$/;
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				o.$validators.phoneComplete = function (n, t) {
					return !!o.$isEmpty(n) || e.test(t)
				}
			}
		}
	}]), n.directive("inputPhoneNumber", [function () {
		var e = /^9\d{4}-\d{4}$/;
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				o.$validators.phoneNumber = function (n, t) {
					return !!o.$isEmpty(n) || e.test(t)
				}
			}
		}
	}]), n.directive("inputCep", [function () {
		var e = /^\d{5}-\d{3}$/;
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				o.$validators.cep = function (n, t) {
					return !!o.$isEmpty(n) || e.test(t)
				}
			}
		}
	}]), n.directive("inputCardExpiryDate", [function () {
		var e = function () {
			var e, n = new Date,
				t = parseInt(n.getFullYear().toString().slice(-2)),
				r = "(" + ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].filter(function (e, t) {
					return t >= n.getMonth()
				}).join("|") + ")/" + t,
				o = [];
			for (e = 1; e < 30; e++) o.push(t + e);
			var i = "(0[1-9]|1[0-2])/(" + o.join("|") + ")";
			return new RegExp("^(" + [r, i].join("|") + ")$")
		}();
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				o.$validators.cardExpiryDate = function (n, t) {
					return !!o.$isEmpty(n) || e.test(t)
				}
			}
		}
	}]), n.directive("inputBirthday", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (n, t, r, o) {
				o.$validators.birthday = function (n, t) {
					return !!o.$isEmpty(n) || function (n) {
						if (!/^\d{2}\/\d{2}\/\d{4}$/.test(e.copy(n))) return !1;
						var t = moment(n, "DD/MM/YYYY");
						return !(!t.isValid() || t.isAfter(moment()))
					}(t)
				}
			}
		}
	}]), n.directive("checkboxRequired", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, r) {
				r.$validators.required = function (e) {
					return !!e
				}
			}
		}
	}]), n.directive("radioRequired", [function () {
		return {
			restrict: "C",
			require: "ngModel",
			link: function (e, n, t, r) {
				r.$validators.required = function (e) {
					return !!e
				}
			}
		}
	}])
}(window.angular),
function (e) {
	"use strict";
	window.angular.module("snwLoading", []).controller("LoadingController", ["$scope", function (e) {
		var n = this;
		n.show = !1;
		var t = function () {
			n.show = !1
		};
		e.$on("$routeChangeStart", function (t) {
			e.$evalAsync(function () {
				n.show = !t.defaultPrevented
			})
		}), e.$on("$routeChangeSuccess", t), e.$on("$routeChangeError", t)
	}])
}(),
function (e, n, t) {
	"use strict";
	e.module("snwLockr", []).service("snwLockrService", ["$window", function (e) {
		var t = function (t, r) {
			return r = void 0 === _typeof(r) ? null : r, e.cookieEnabled ? n.get(t, r) : r
		};
		return {
			hasKey: function (n) {
				return !!e.cookieEnabled && !!t(n, null)
			},
			get: t,
			set: function (t, r) {
				return !!e.cookieEnabled && (n.set(t, r), !0)
			},
			rm: function (t) {
				return !!e.cookieEnabled && (n.rm(t), !0)
			}
		}
	}])
}(window.angular, window.Lockr),
function (e) {
	"use strict";
	e.module("snwSwal", []).service("$swal", ["$q", "$timeout", function (n, t) {
		var r = function (r, o) {
			return function (i, a, s) {
				var c = n.defer();
				s = e.isObject(s) ? s : {};
				var u = e.merge({
					type: r,
					showCancelButton: !1,
					cancelButtonText: "Cancelar",
					resolve: !1,
					reject: !1,
					customClass: "snw-swal"
				}, o, s, {
					title: a || "",
					text: i || "",
					allowEscapeKey: !1,
					confirmButtonColor: "#F28D20",
					closeOnConfirm: !0,
					closeOnCancel: !0
				});
				return swal(u, function (e) {
					t(300).then(function () {
						!1 === e || !u.resolve && u.reject ? c.reject(u.reject || !1) : c.resolve(u.resolve || e)
					})
				}), c.promise
			}
		};
		this.success = r("success", {}), this.warning = r("warning", {}), this.error = r("error", {}), this.info = r("info", {}), this.confirm = r("warning", {
			showCancelButton: !0
		}), this.prompt = r("input", {
			showCancelButton: !0,
			inputPlaceholder: "Digite algo..."
		}), this.message = r("", {})
	}])
}(window.angular),
function (e, n) {
	"use strict";
	window.angular.module("snwLog", []).service("LogService", ["$q", "$http", "SNW_BASE_URL", function (e, n, t) {
		return {
			sendAlerts: function (r, o) {
				var i = e.defer(),
					a = [t, "api/helper/log-error"].join("/"),
					s = {
						title: r,
						message: o
					};
				return n.post(a, s).then(function (e) {
					i.resolve(e)
				}).catch(function (e) {
					i.reject(e)
				}), i.promise
			}
		}
	}])
}(),
function (e, n) {
	"use strict";
	var t = e.module("snwCompositeModel", []),
		r = {
			$addControl: e.noop,
			$$renameControl: function (e, n) {
				e.$name = n
			},
			$removeControl: e.noop,
			$setValidity: e.noop,
			$setDirty: e.noop,
			$setPristine: e.noop,
			$setUntouched: e.noop,
			$setSubmitted: e.noop,
			$setTouched: e.noop,
			validate: e.noop,
			update: e.noop,
			render: e.noop
		},
		o = function (n) {
			var t, o, i, a, s = this,
				c = [],
				u = {},
				d = !0;
			e.extend(s, r), s.disabled = !1, s.required = !1, s.$addControl = function (e) {
				e !== s.model ? (c.push(e), e.$name && (s[e.$name] = e), e.$$parentForm = s) : s.parent && s.parent.$addControl(e)
			}, s.$$renameControl = function (e, n) {
				var t = e.$name;
				s[t] === e && delete s[t], s[n] = e, e.$name = n
			}, s.$setValidity = function (n, t, r) {
				s.model && (t = !(!1 === t), e.forEach(c, function (r) {
					t = !!t && e.isUndefined(r.$error[n])
				}), s.model.$setValidity(n, t), t ? delete u[n] : u[n] = !0, d = !0, e.forEach(u, function () {
					d = !1
				}))
			}, s.$setDirty = function () {
				s.model && s.model.$setDirty()
			}, s.$setPristine = function () {
				s.model && s.model.$setPristine(), e.forEach(c, function (e) {
					e.$setPristine()
				})
			}, s.$setUntouched = function () {
				s.model && s.model.$setUntouched(), e.forEach(c, function (e) {
					e.$setUntouched()
				})
			}, s.$setSubmitted = function () {
				s.parent && s.parent.$setSubmitted()
			}, s.validate = function () {
				u = {}, e.forEach(c, function (e) {
					e.$validate()
				}), s.model.$validate()
			}, s.$setTouched = function () {
				s.model && s.model.$setTouched()
			}, s.update = function (e) {
				s.model && (e = d ? e : null, s.model.$setViewValue(e), s.model.$commitViewValue())
			}, s.$onInit = function () {
				s.model && (s.model.$render = function () {
					s.model.$invalid || s.render(s.model.$viewValue)
				}, s.model.isSnwModel = !0, s.model.isDirty = function () {
					var n = !1;
					return e.forEach(c, function (e) {
						n = n || e.$dirty
					}), n
				}, t = n.$watch("ctrl.model.$pristine", function (e, n) {
					e && s.$setPristine()
				}), o = n.$watch("ctrl.model.$untouched", function (e, n) {
					e && s.$setUntouched()
				}), i = n.$watch("ctrl.parent.$pristine", function (e, n) {
					e && s.$setPristine()
				}), a = n.$watch("ctrl.parent.$untouched", function (e, n) {
					e && s.$setUntouched()
				}), n.$applyAsync(function () {
					s.model.$validators.required = function () {
						var n = !0;
						return s.required && e.forEach(c, function (e) {
							n = n && e.$valid
						}), n
					}, s.validate(), s.model.$setPristine()
				}))
			}, n.$on("$destroy", function () {
				e.extend(s, r), e.isFunction(t) && (t(), t = null), e.isFunction(o) && (o(), o = null), e.isFunction(i) && (i(), i = null), e.isFunction(a) && (a(), a = null)
			})
		};
	o.$inject = ["$scope"], t.directive("snwModel", [function () {
		return {
			restrict: "C",
			name: "form",
			require: {
				form: "form",
				model: "ngModel",
				parent: "^^?form"
			},
			controller: o,
			controllerAs: "snwCtrl",
			bindToController: !0,
			scope: !1,
			link: function (n, t, r, o) {
				var i, a, s = function () {
						o.form.$setTouched(), t.addClass("snw-model--focus")
					},
					c = function () {
						t.removeClass("snw-model--focus")
					};
				t[0].addEventListener("focus", s, !0), t[0].addEventListener("blur", c, !0), i = r.$observe("disabled", function (e) {
					o.form.disabled = !0 === e || "true" === e || "disabled" === e || "" === e
				}), a = r.$observe("required", function (e) {
					o.form.required = !0 === e || "true" === e || "required" === e || "" === e
				}), t.on("$destroy", function () {
					t[0].removeEventListener("focus", s, !0), t[0].removeEventListener("blur", c, !0), e.isFunction(i) && (i(), i = null), e.isFunction(a) && (a(), a = null)
				})
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwIsolateForm", []),
		r = {
			$addControl: e.noop,
			$$renameControl: function (e, n) {
				e.$name = n
			},
			$removeControl: e.noop,
			$setValidity: e.noop,
			$setDirty: e.noop,
			$setPristine: e.noop,
			$setUntouched: e.noop,
			$setSubmitted: e.noop,
			$setTouched: e.noop,
			validate: e.noop,
			update: e.noop,
			render: e.noop
		},
		o = function (n, t, o) {
			var i = this,
				a = [],
				s = {};
			e.extend(i, r), i.disabled = !1, i.$valid = !0, i.$invalid = !1, i.$name = o(t.name || "")(n), i.$addControl = function (e) {
				a.push(e), e.$name && (i[e.$name] = e), e.$$parentForm = i
			}, i.$$renameControl = function (e, n) {
				var t = e.$name;
				i[t] === e && delete i[t], i[n] = e, e.$name = n
			}, i.$setValidity = function (n, t, r) {
				t = !(!1 === t), e.forEach(a, function (r) {
					t = !!t && e.isUndefined(r.$error[n])
				}), t ? delete s[n] : s[n] = !0, i.$valid = !0, e.forEach(s, function () {
					i.$valid = !1
				}), i.$invalid = !i.$valid
			}, i.validate = function () {
				s = {}, e.forEach(a, function (e) {
					e.$validate()
				})
			}
		};
	o.$inject = ["$scope", "$attrs", "$interpolate"], t.directive("snwIsolate", ["$parse", function (n) {
		var t = function (e) {
			return "" === e ? n('this[""]').assign : n(e).assign || noop
		};
		return {
			restrict: "C",
			name: "form",
			require: {
				form: "form"
			},
			controller: o,
			controllerAs: "snwIsolateCtrl",
			bindToController: !0,
			scope: {
				submit: "&onSubmit"
			},
			compile: function (n, o) {
				var i = !!o.name && "name";
				return {
					pre: function (n, o, a, s) {
						var c, u = s.form,
							d = i ? t(u.$name) : e.noop,
							l = n.$parent || n;
						i && (d(l, u), c = a.$observe("name", function (e) {
							u.$name !== e && (d(l, void 0), (d = t(u.$name))(l, u))
						})), o.on("$destroy", function () {
							e.isFunction(c) && (c(), c = null), d(l, void 0), e.extend(u, r)
						})
					},
					post: function (n, t, r, o) {
						var i, a = function (t) {
							13 != t.keyCode && 13 != t.which || (t.preventDefault(), t.stopImmediatePropagation(), n.$apply(function () {
								e.isFunction(o.form.submit) && o.form.submit()
							}))
						};
						t[0].addEventListener("keypress", a, !0), i = r.$observe("disabled", function (e) {
							o.form.disabled = !0 === e || "true" === e || "disabled" === e || "" === e
						}), t.on("$destroy", function () {
							t[0].removeEventListener("keypress", a, !0), e.isFunction(i) && (i(), i = null)
						})
					}
				}
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = (new Date).getFullYear(),
		r = function (e, n, t) {
			var r, o = [],
				i = !1;
			for (t = (t = (t = +t) != t || 0 === t ? 1 : t) < 0 ? -t : t, n < e && (r = e, e = n, n = r, i = !0), r = e; r < n + 1; r += t) o.push(r);
			return !0 === i ? o.reverse() : o
		},
		o = e.module("snwDateUI", ["snwCompositeModel"]),
		i = function (n, o) {
			var i = this,
				a = function (e, n, t) {
					return [("0000" + e).slice(-4), ("00" + n).slice(-2), ("00" + t).slice(-2)].join("-")
				},
				s = function (n) {
					if (!/^\d{4}-\d{2}-\d{2}/.test(n)) return !1;
					n = n.slice(0, 10);
					var t = +o("date")(n, "dd"),
						r = +o("date")(n, "MM"),
						i = +o("date")(n, "yyyy"),
						a = new Date(i, r - 1, t);
					return e.isDate(a) && a.getDate() === t && a.getMonth() === r - 1 && a.getFullYear() === i && [i, r, t]
				};
			i.options = {}, i.options.days = r(1, 31), i.options.months = r(1, 12), i.options.years = r(+t - 10, 1900, -1), i.date = {}, i.$onInit = function () {
				i.model.render = function (n) {
					var t = s(n);
					e.isArray(t) && (i.date.year = t[0], i.date.month = t[1], i.date.day = t[2])
				}, i.ngModel.$validators.date = function (n, t) {
					var r = n || t,
						o = s(r);
					return e.isArray(o) && a(o[0], o[1], o[2]) === r
				}, n.$watch("dateCtrl.ngModel.$modelValue", function (e) {
					i.ngModel.$invalid || i.model.render(e)
				}, !0)
			}, n.$watch("dateCtrl.date", function (e) {
				i.model.update(a(e.year, e.month, e.day))
			}, !0)
		};
	i.$inject = ["$scope", "$filter"], o.directive("snwDate", [function () {
		return {
			restrict: "C",
			scope: !1,
			require: {
				model: "form",
				ngModel: "ngModel"
			},
			templateUrl: "date.template",
			controller: i,
			controllerAs: "dateCtrl",
			bindToController: !0
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwPhoneUI", ["snwCore", "snwCompositeModel"]);
	t.factory("PhoneGetterSetter", ["ValueCleanerService", function (n) {
		return function (t, r, o) {
			var i = {};
			return function (a) {
				var s;
				return arguments.length ? (e.isString(a) && (a = {
					areaCode: (s = n.clear(a, "").split("-"))[0],
					number: s[1]
				}), e.isObject(a) || (a = {
					areaCode: null,
					number: null
				}), t[r] = n.digitsOnly(a.areaCode) || "", t[o] = n.digitsOnly(a.number) || "", e.extend(i, {
					areaCode: t[r],
					number: t[o]
				}), i) : i
			}
		}
	}]);
	var r = function (n, t) {
		var r = this;
		r.phone = {}, r.$onInit = function () {
			r.model.render = function (n) {
				e.isObject(n) ? (r.phone.areaCode = t.digitsOnly(n.areaCode), r.phone.number = t.digitsOnly(n.number)) : e.extend(r.phone, {
					areaCode: void 0,
					number: void 0
				})
			}, n.$watch("phoneCtrl.ngModel.$modelValue", function (e) {
				r.ngModel.$invalid || r.model.render(e)
			}, !0)
		}, n.$watch("phoneCtrl.phone", function (e) {
			r.model.update(e)
		}, !0)
	};
	r.$inject = ["$scope", "ValueCleanerService"], t.directive("snwPhone", [function () {
		return {
			restrict: "C",
			scope: !1,
			require: {
				model: "form",
				ngModel: "ngModel"
			},
			templateUrl: "phone.template",
			controller: r,
			controllerAs: "phoneCtrl",
			bindToController: !0
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwAddressCompleter", ["snwCore"]);
	t.service("AddressCleanerService", ["ValueCleanerService", function (n) {
		this.clear = function (t) {
			return e.isObject(t) || (t = {}), {
				street_name: n.clear(t.street_name),
				street_number: n.clear(t.street_number),
				additional_info: n.clear(t.additional_info),
				zone: n.clear(t.zone),
				postal_code: n.digitsOnly(t.postal_code),
				state_id: n.clear(t.state_id),
				city_id: n.digitsOnly(t.city_id),
				city_name: n.clear(t.city_name)
			}
		}
	}]), t.service("AddressCompleter", ["$q", "$timeout", "$http", "SNW_BASE_URL", "ValueCleanerService", "AddressCleanerService", function (n, t, r, o, i, a) {
		var s, c;
		this.findCitiesForState = function (n) {
			if (n) return t.cancel(s), s = t(500).then(function () {
				return r.get([o, "api/helper/cities", n].join("/"))
			}).then(function (n) {
				return e.isArray(n.data) && n.data.length ? n.data : []
			})
		}, this.findByPostalCode = function (e) {
			return t.cancel(c), e && /\d{8}/.test(e) ? c = t(500).then(function () {
				return r.get("https://viacep.com.br/ws/{postalCode}/json/unicode/".replace("{postalCode}", e))
			}).then(function (t) {
				var s, c, u;
				return t && t.data && !t.data.erro ? (s = i.clear(t.data.localidade, !1), c = i.clear(t.data.uf, !1), s && c ? (u = a.clear({
					street_name: t.data.logradouro,
					zone: t.data.bairro,
					postal_code: e,
					state_id: c
				}), n.all({
					address: u,
					city: r.get([o, "api/helper/city", s, c].join("/"))
				})) : n.reject(!1)) : n.reject(!1)
			}).then(function (e) {
				var t = e.address,
					r = e.city;
				return r && r.data && r.data.id ? (t.city_id = i.digitsOnly(r.data.id, !1), t.city_name = i.clear(r.data.name, !1), t.city_id ? a.clear(t) : n.reject(!1)) : n.reject(!1)
			}) : n.reject(!1)
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwCustomItems", ["snwSwal", "snwModal", "snwCartCore", "snwQuantityControl"]),
		r = 1,
		o = function (n) {
			return ["$q", "$scope", "$swal", "$http", "CartService", function (t, o, i, a, s) {
				var c = this,
					u = !1,
					d = {
						name: null,
						quantity: 0,
						price: 0
					},
					l = {
						selected: "0",
						value: null
					};
				c.data = e.copy(d), c.type = e.copy(l), c.showNewProduct = !1, c.hasItems = function () {
					return !!u && !!c.items.length
				}, c.isDisabled = function () {
					return !!c.disabled
				}, c.changeType = function () {
					c.type.value = null
				}, c.isWeight = function () {
					return r == c.type.selected
				}, c.toggleModal = function () {
					c.showNewProduct = !c.showNewProduct
				}, c.remove = function (e) {
					return !!c.isDisabled() || (!c.items.length || void t.when(i.confirm("Deseja realmente excluir o item?", "", {
						confirmButtonText: "sim",
						cancelButtonText: "não"
					})).then(function () {
						c.items.splice(e, 1)
					}))
				}, c.salvar = function () {
					return null === c.data.name || 0 == c.data.name.length ? i.warning("Informe o nome do produto", "") : c.data.name.length < 3 ? i.warning("Seja mais detalhista para facilitar o shopper.", "") : 0 == c.data.quantity ? i.warning("A quantidade deve ser mair que zero", "") : (c.isWeight() && c.type.value && parseFloat(c.type.value) && (c.data.name += " - " + c.type.value + " gr"), void t.when(n ? t.resolve() : t.reject()).then(function () {
						c.items.push(e.copy(c.data))
					}).catch(function () {
						return s.includeCustomItem(c.data.name, c.data.quantity, 0)
					}).catch(function () {
						return i.warning("Não foi possível incluir os produtos", "Atenção")
					}).finally(function () {
						c.data = e.extend({}, d), c.type = e.extend({}, l), c.toggleModal()
					}))
				}, o.$applyAsync(function () {
					if (c.disabled = void 0 !== c.disabled && c.disabled, void 0 === c.items) throw new Error("items is required");
					if (!e.isArray(c.items)) throw new Error("items is not array");
					u = !0
				}), o.$watch("ctrl.type.selected", function (e, n) {
					e != n && (c.type.value = 0)
				})
			}]
		};
	t.directive("snwCustomItems", [function () {
		return {
			restrict: "EC",
			scope: {
				items: "<",
				disabled: "=?"
			},
			templateUrl: "custom-items.template",
			controllerAs: "ctrl",
			bindToController: !0,
			controller: o(!0)
		}
	}]), t.directive("snwCartCustomItems", [function () {
		return {
			restrict: "EC",
			scope: {
				items: "<",
				disabled: "=?"
			},
			templateUrl: "cart-custom-items.template",
			controllerAs: "ctrl",
			bindToController: !0,
			controller: o(!1)
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwQuantityControl", ["snwCore", "snwLockr"]);
	t.constant("SNW_QUANTITY_INCREMENT_EVENT", "snw:quantity-control-increment"), t.constant("SNW_QUANTITY_DECREMENT_EVENT", "snw:quantity-control-decrement"), t.constant("SNW_QUANTITY_UPDATE_EVENT", "snw:quantity-control-update"), t.directive("snwQuantityControl", ["BroadcastService", "SNW_QUANTITY_INCREMENT_EVENT", "SNW_QUANTITY_DECREMENT_EVENT", function (n, t, r) {
		return {
			restrict: "EC",
			scope: {
				instance: "=",
				limit: "<?",
				disabled: "<?"
			},
			templateUrl: "quantity-control.template",
			link: function (o) {
				o.isDisabled = function () {
					return !!o.disabled
				}, o.selected = function () {
					return !!o.instance.quantity
				}, o.increment = function () {
					return !!o.isDisabled() || (null != o.limit && o.instance.quantity >= o.limit || (o.instance.quantity++, void n.broadcast(t, o.instance)))
				}, o.decrement = function () {
					return !!o.isDisabled() || (o.instance.quantity <= 0 || (o.instance.quantity--, void n.broadcast(r, o.instance)))
				}, o.$applyAsync(function () {
					if (o.limit = void 0 === o.limit ? null : o.limit, o.disabled = void 0 !== o.disabled && o.disabled, void 0 === o.instance) throw new Error("Instance is required");
					if (!e.isObject(o.instance)) throw new Error("Instance is not object");
					void 0 !== o.instance.quantity && null !== o.instance.quantity || (o.instance.quantity = 0)
				})
			}
		}
	}]), t.directive("snwFullQuantityControl", ["$swal", "$http", "$location", "CartService", "CartItemAttributeService", "BroadcastService", "snwAuthenticateUser", "SNW_QUANTITY_INCREMENT_EVENT", "SNW_QUANTITY_DECREMENT_EVENT", "SNW_QUANTITY_UPDATE_EVENT", "SNW_SHOW_PRODUCT_LOGIN_EVENT", "snwLockrService", "TABLOIDE_ADD_PRODUCT_STORAGE_KEY", "$window", "SNW_BASE_URL", function (n, t, r, o, i, a, s, c, u, d, l, p, f, m, g) {
		return {
			restrict: "EC",
			scope: {
				instance: "=",
				limit: "<?",
				disabled: "<?",
				addOrder: "<?"
			},
			templateUrl: "full-quantity-control.template",
			link: function (c) {
				c.isUpdating = !1, c.buttonLabel = function () {
					return 0 == c.instance.originalQuantity ? "Adicionar" : c.instance.quantity > 0 && c.instance.originalQuantity != c.instance.quantity ? "Alterar" : c.instance.quantity > 0 && c.instance.originalQuantity == c.instance.quantity ? "Adicionado" : c.instance.originalQuantity > 0 && 0 == c.instance.quantity ? "Remover" : void 0
				}, c.quantityLabel = function (e) {
					return c.instance.step_type_id && 2 == c.instance.step_type_id ? c.instance.unit_amount * e + c.instance.unit_label : e
				}, c.incrementQuantity = function (e) {
					c.instance.quantity += e
				}, c.updateItem = function () {
					if (c.addOrder && !0 === c.addOrder) {
						if (0 == c.instance.quantity) return n.message("Adicione pelo menos 1 item", "Ops!");
						if (!c.instance.name) return n.message("Preencha o nome do produto", "Ops!");
						void 0 !== c.instance.weight && (c.instance.name = c.instance.name + " - " + c.instance.weight + " gramas");
						var e = p.get("ORDER_UUID");
						n.message("Tem certeza de que deseja adicionar este produto?", "Atenção", {
							html: !0,
							title: "",
							text: "Tem certeza de que deseja adicionar este produto?",
							confirmButtonColor: "#F28D20",
							confirmButtonText: "Sim",
							showCancelButton: !0,
							cancelButtonText: "Não",
							imageUrl: "/images/common/img_logonow_grey.svg",
							imageWidth: 300,
							imageHeight: 300
						}).then(function () {
							return t.post([g, "api/v2/orders", e, "items"].join("/"), {
								items: [c.instance]
							})
						}).then(function () {
							return n.success("Itens Adicionados ao seu pedido!", "Sucesso")
						}).then(function () {
							var n = p.get("IS_SUBSTITUTION"),
								r = p.get("SUBSTITUTION_LINK");
							p.rm("ORDER_UUID"), p.rm("IS_SUBSTITUTION"), p.rm("SUBSTITUTION_LINK"), n && n === e ? t.post([g, "api/v2/orders", e, "substitutions/messages"].join("/"), {
								message: "Gostaria de adicionar ao meu pedido: ",
								object: {
									type: "newItem",
									item: [c.instance]
								}
							}).then(function () {
								m.location.href = r
							}) : m.location.href = [g, "pedidos", e].join("/")
						}).catch(function (e) {
							var t = e.data.errors;
							return n.error(t[0].message, "Atenção", {
								reject: !0
							})
						})
					} else {
						if (s.isFakeUser()) {
							a.broadcast(d, c.instance);
							var u = {
								name: c.instance.name,
								product_id: c.instance.product_id,
								amount: c.instance.quantity,
								expirateAt: null,
								path: null
							};
							return u.expirateAt = (new Date).getTime() + 18e5, void o.getCategoryTree(c.instance.product_store_id).then(function (e) {
								u.path = [e[e.length - 1].url].join("/"), p.set(f, JSON.stringify(u)), m.location.pathname.split("/").length > 1 && (m.location.href = [g, m.location.pathname.split("/")[1], "compra", u.path].join("/"))
							})
						}
						if (c.instance.quantity != c.instance.originalQuantity) {
							c.isUpdating = !0;
							var l = c.instance.quantity - c.instance.originalQuantity,
								v = i.formatData(!1, r.path());
							l > 0 ? o.increment(c.instance, l, v).then(function () {
								c.isUpdating = !1, a.broadcast(d, c.instance)
							}) : l < 0 && o.decrement(c.instance, -l).then(function () {
								c.isUpdating = !1, a.broadcast(d, c.instance)
							})
						}
					}
				}, c.$applyAsync(function () {
					if (c.limit = void 0 === c.limit ? null : c.limit, c.disabled = void 0 !== c.disabled && c.disabled, void 0 === c.instance) throw new Error("Instance is required");
					if (!e.isObject(c.instance)) throw new Error("Instance is not object");
					void 0 !== c.instance.quantity && null !== c.instance.quantity || (c.instance.quantity = 0), void 0 !== c.instance.originalQuantity && null !== c.instance.originalQuantity || (c.instance.originalQuantity = 0)
				})
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = e.module("snwAddressUI", ["snwCore", "snwCompositeModel", "snwAddressCompleter"]),
		r = function (n, t, r, o, i, a, s, c, u) {
			var d = this,
				l = !1,
				p = !1,
				f = !1,
				m = !1,
				g = [],
				v = ["postal_code", "street_name", "street_number", "additional_info", "zone", "state_id", "city_id"],
				h = function () {
					l = !0, d.model.$setValidity("loading", !1)
				},
				w = function () {
					l = !1, d.model.$setValidity("loading", !0)
				},
				_ = function (e) {
					var n = +d.address.city_id;
					return e ? (h(), i.findCitiesForState(e).then(function (e) {
						d.cities = e;
						var t = d.cities.filter(function (e) {
							return n === +e.id
						})[0];
						d.address.city_id = t ? n : null, w()
					}).catch(function () {
						return o.warning(["Erro ao buscar as cidades do estado ", e].join(""), "", {
							reject: !0
						})
					}).catch(function () {
						w()
					})) : t.reject(!1)
				};
			d.isInvalid = a, d.cities = [], d.address = {}, d.setAddress = function (t, r) {
				t.street_number || (t.street_number = d.address.street_number), t.additional_info || (t.additional_info = d.address.additional_info), e.extend(d.address, u.clear(t)), g.length = 0, !0 === m && e.forEach(d.address, function (e, n) {
					["additional_info", "street_number"].indexOf(n) > -1 || !1 === c.clear(e, !1) || g.push(n)
				}, d), _(d.address.state_id).finally(function () {
					r && n.$applyAsync(function () {
						var t = !1;
						e.forEach(v, function (e) {
							t || -1 !== g.indexOf(e) || d.address[e] || (t = !0, n.$broadcast(s, e))
						})
					})
				})
			}, d.isDisabled = function (e) {
				return d.model.disabled || l || -1 !== g.indexOf(e)
			}, d.$onInit = function () {
				p = "true" === r.autofocus, m = "true" === r.disableFilledFields, f = "true" === r.fetchPostalCode, d.model.render = function (e) {
					d.setAddress(e, p)
				}
			}, n.$watch("addressCtrl.address", function (e, n) {
				if (f && e && (!n || e.postal_code !== n.postal_code)) return (r = e.postal_code, r && /\d{8}/.test(r) ? (h(), i.findByPostalCode(r).then(function (e) {
					w(), d.setAddress(e, !0)
				}).catch(function () {
					return o.warning(["O CEP [", r, "] não foi encontrado"].join(""), "", {
						reject: !0
					})
				}).catch(function () {
					w(), d.setAddress({
						postal_code: r
					})
				})) : t.reject(!1)).finally(function () {
					d.model.update(d.address)
				});
				var r;
				d.model.update(e), !e || n && e.state_id === n.state_id || _(e.state_id)
			}, !0)
		};
	r.$inject = ["$scope", "$q", "$attrs", "$swal", "AddressCompleter", "IsInvalidModel", "SNW_INPUT_FOCUS_EVENT", "ValueCleanerService", "AddressCleanerService"], t.directive("snwAddress", [function () {
		return {
			restrict: "C",
			scope: !1,
			require: {
				model: "form"
			},
			templateUrl: "address.template",
			controller: r,
			controllerAs: "addressCtrl",
			bindToController: !0
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = navigator.userAgent || navigator.vendor || window.opera || "desktop",
		r = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(t) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(t.substr(0, 4)),
		o = e.module("snwCoreUI", ["snwInputMasks", "snwInputValidators"]);
	o.constant("SNW_SHOW_PRODUCT_LOGIN_EVENT", "snw:snw-show-product-login"), o.constant("SNW_REPAINT_EVENT", "snw:repaint"), o.constant("SNW_SCROLL_TOP_EVENT", "snw:scroll-top"), o.constant("SNW_INPUT_FOCUS_EVENT", "snw:input-focus"), o.constant("IS_MOBILE", r), o.value("scrollPositions", {}), o.run(["$window", "$rootScope", "$location", "BroadcastService", "SNW_SCROLL_TOP_EVENT", function (n, t, r, o, i) {
		var a = function (e) {
			return function () {
				o.broadcastRepaint(), e && o.broadcast(i, e)
			}
		};
		n.addEventListener("resize", a(!1), !1), t.$on("$routeChangeStart", a(!1)), t.$on("$routeChangeSuccess", a(!0)), t.$on("$routeChangeError", function (t, o, i, a) {
			if (!(e.isObject(a) && a.status < 0)) return e.isObject(a) && a.redirectTo ? !0 === a.global ? void n.location.replace(a.redirectTo) : void r.path(a.redirectTo).replace() : void(e.isDefined(i) ? n.history.back() : r.path("/").replace())
		}), a(!0)()
	}]), o.service("BrowserDimensionService", ["$window", "$document", function (n, t) {
		var r = t[0];
		this.elementDimensions = function (e) {
			var n = e.getBoundingClientRect();
			return {
				top: n.top,
				left: n.left,
				bottom: n.bottom,
				right: n.right,
				height: n.height || n.bottom - n.top,
				width: n.width || n.right - n.left
			}
		}, this.windowDimensions = function () {
			var e = void 0 !== window.pageXOffset,
				t = "CSS1Compat" === (document.compatMode || ""),
				o = e ? n.pageXOffset : t ? r.documentElement.scrollLeft : r.body.scrollLeft;
			return {
				scrollTop: e ? n.pageYOffset : t ? r.documentElement.scrollTop : r.body.scrollTop,
				scrollLeft: o,
				height: +(n.innerHeight || r.documentElement.clientHeight),
				width: +(n.innerWidth || r.documentElement.clientWidth)
			}
		}, this.scrollVertically = function (t) {
			e.isFunction(n.scrollTo) && n.scrollTo(t, 0)
		}
	}]), o.service("BroadcastService", ["$rootScope", "$timeout", "BrowserDimensionService", "SNW_REPAINT_EVENT", function (e, n, t, r) {
		var o = function (n, t, r) {
			return function () {
				e.$evalAsync(function () {
					e.$broadcast(n, t, r)
				})
			}
		};
		this.broadcastRepaint = function (e) {
			var i = t.windowDimensions(),
				a = o(r, i.width, i.height);
			e = +e, a(), e > 0 && n(a, e)
		}, this.broadcast = function (e, t, r) {
			var i = o(e, t);
			r = +r, i(), r > 0 && n(i, r)
		}
	}]), o.directive("body", ["BroadcastService", function (n) {
		return {
			restrict: "E",
			link: function (t, r) {
				var o, i = function () {
					t.$apply(function () {
						n.broadcast("snw:dropdown-close", null)
					})
				};
				o = t.$on("snw:dropdown-register", function () {
					r.on("click keyup focus", i), o()
				}), r.on("$destroy", function () {
					r.off("click", i), r.off("keyup", i), r.off("focus", i), e.isFunction(o) && o()
				})
			}
		}
	}]), o.directive("dropdownToggle", ["BroadcastService", function (n) {
		var t = 0;
		return n.broadcast("snw:dropdown-register"), {
			restrict: "C",
			link: function (r, o) {
				var i, a = "dropdowToggle_" + t++,
					s = o.parent(),
					c = function (e) {
						e.stopPropagation(), s.toggleClass("open"), r.$apply(function () {
							n.broadcast("snw:dropdown-close", a)
						})
					};
				o.on("click", c), i = r.$on("snw:dropdown-close", function (e, n) {
					n !== a && s.removeClass("open")
				}), o.on("$destroy", function () {
					o.off("click", c), e.isFunction(i) && (i(), i = null)
				})
			}
		}
	}]);
	var i = function (n, t) {
		return function (r, o, i) {
			return {
				restrict: "A",
				link: function (a, s, c) {
					var u, d, l = r[0],
						p = 0,
						f = e.element("#scroll-content--append-to-bottom") || !1,
						m = 0,
						g = t;
					c[n] && (d = l.querySelector(c[n])) && (c.cssProperty && (g = c.cssProperty), c.addProperty && (p = +c.addProperty) != p && (p = 0), u = a.$on(i, function () {
						var e = o.elementDimensions(d)[t] + p,
							n = !!f && f.outerHeight(!0) || 0;
						if (e == e) {
							if (m === e && !n) return;
							m = e, s[0].setAttribute("style", [g, ":", e, "px;", "padding-bottom:", n, "px;"].join(""))
						}
					}), s.on("$destroy", function () {
						e.isFunction(u) && (u(), u = null)
					}))
				}
			}
		}
	};
	o.directive("snwMatchHeight", ["$document", "BrowserDimensionService", "SNW_REPAINT_EVENT", i("snwMatchHeight", "height")]), o.directive("snwMatchWidth", ["$document", "BrowserDimensionService", "SNW_REPAINT_EVENT", i("snwMatchWidth", "width")]), o.directive("snwScrollTop", ["$window", "$location", "scrollPositions", "SNW_SCROLL_TOP_EVENT", function (n, t, r, o) {
		return {
			restrict: "AC",
			link: function (n, i) {
				var a, s, c = !0;
				a = n.$on(o, function () {
					c = !1;
					var e = +r[t.path()];
					n.$applyAsync(function () {
						e == e ? (i[0].scrollTop = e, delete r[t.path()]) : i[0].scrollTop = 0, c = !0
					})
				}), n.$on("$routeChangeStart", function () {
					c = !1
				});
				var u = function () {
					c && (r[t.path()] = i[0].scrollTop)
				};
				i.on("scroll", u), i.on("$destroy", function () {
					e.isFunction(a) && (a(), a = null), e.isFunction(s) && (s(), s = null), i.off("scroll", u)
				})
			}
		}
	}]), o.directive("snwRepaintOnScroll", ["BroadcastService", function (e) {
		return {
			restrict: "AC",
			link: function (n, t) {
				var r = function () {
					n.$apply(function () {
						e.broadcastRepaint()
					})
				};
				t.on("scroll", r), t.on("$destroy", function () {
					t.off("scroll", r)
				})
			}
		}
	}]), o.directive("value", ["$parse", function (n) {
		return {
			restrict: "A",
			require: "?ngModel",
			priority: 1e4,
			link: function (t, r, o, i) {
				var a, s = o.value && ("" + (o.value || "")).trim(),
					c = o.type && ("" + (o.type || "")).trim();
				i && e.isString(s) && 0 !== s.length && (!e.isString(s) || "radio" !== c && "checkbox" !== c) && (a = n(o.ngModel), i.$options && i.$options.getterSetter && e.isFunction(a(t)) ? n(o.ngModel + "($$$snwNgModelValue)")(t, {
					$$$snwNgModelValue: s
				}) : a.assign(t, s), i.$setUntouched(), i.$setPristine(), t.$applyAsync(function () {
					i.$render(), i.$setUntouched(), i.$setPristine()
				}))
			}
		}
	}]), o.directive("input", [function () {
		return {
			restrict: "E",
			require: "?ngModel",
			link: function (n, t, r, o) {
				o && (e.isDefined(r.type) && "email" !== r.type || (o.$validators.email = function (e) {
					return !!o.$isEmpty(e) || /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(e)
				}))
			}
		}
	}]), o.factory("AddModelErrorsFromServer", ["$q", "$timeout", function (n, t) {
		var r;
		return function (o) {
			return function (i) {
				return 422 === i.status && (e.forEach(i.data, function (e, n) {
					o[n] && (o[n].$setValidity("server-validation", !1), o[n].$$snwErrorMessages = e)
				}), t.cancel(r), r = t(function (n, t) {
					return function () {
						e.forEach(t, function (e, t) {
							n[t] && (n[t].$setValidity("server-validation", !0), n[t].$$snwErrorMessages && (n[t].$$snwErrorMessages.length = 0))
						})
					}
				}(o, i.data), 5e3)), n.reject(i)
			}
		}
	}]), o.value("IsInvalidModel", function (e) {
		return !e || (!(!e.$$parentForm.$submitted || !e.$invalid) || (!0 === e.isSnwModel && e.$dirty && !e.isDirty() && e.$setPristine(), e.$dirty && e.$invalid))
	}), o.directive("form", function () {
		return {
			restrict: "E",
			require: "form",
			link: function (e, n, t, r) {
				e.$watch(function () {
					return r.$submitted
				}, function (n, t) {
					n !== t && e.$broadcast("$submitted", n)
				}), e.$applyAsync(function () {
					e.$broadcast("$submitted", !!r.$submitted)
				})
			}
		}
	});
	var a = function (e, n, t, r) {
		e.$on("$submitted", function (e, n) {
			r && (n ? r.$setSubmitted() : r.$setPristine())
		})
	};
	o.directive("ngForm", [function () {
		return {
			restrict: "EA",
			require: "form",
			link: a
		}
	}]), o.directive("snwModel", [function () {
		return {
			restrict: "C",
			require: "?form",
			link: a
		}
	}]), o.directive("presentCurrency", [function () {
		return {
			restrict: "EC",
			scope: {
				value: "<"
			},
			template: '<span class="no-wrap-all" ng-class="{ \'text-danger\' : value < 0 }">{{ value | currency }}</span>'
		}
	}]), o.controller("CurrentPathController", ["$location", function (e) {
		this.isCurrentPath = function (n, t) {
			return !0 === t ? -1 !== e.path().indexOf(n) : n === e.path()
		}, this.getCurrentPath = function () {
			return e.path()
		}
	}]), o.directive("inputGroup", [function () {
		return {
			restrict: "C",
			link: function (e, n) {
				var t = function () {
						n.addClass("input-group--focus")
					},
					r = function () {
						n.removeClass("input-group--focus")
					};
				n[0].addEventListener("focus", t, !0), n[0].addEventListener("blur", r, !0), n.on("$destroy", function () {
					n[0].removeEventListener("focus", t, !0), n[0].removeEventListener("blur", r, !0)
				})
			}
		}
	}]), o.directive("formControl", ["$timeout", "SNW_INPUT_FOCUS_EVENT", function (n, t) {
		return {
			restrict: "C",
			link: function (r, o, i) {
				var a, s = i.name;
				s && (a = r.$on(t, function (e, t) {
					s === t && n(function () {
						o[0].focus()
					}, 150)
				}), o.on("$destroy", function () {
					e.isFunction(a) && (a(), a = null)
				}))
			}
		}
	}]), o.directive("focusOn", ["$timeout", "ValueCleanerService", function (n, t) {
		return {
			restrict: "A",
			link: function (r, o, i) {
				var a, s;
				a = i.$observe("focusOn", function (e) {
					(e = t.clear(e)) && (s = r.$on(e, function () {
						n(function () {
							o[0].focus()
						}, 150)
					}))
				}), o.on("$destroy", function () {
					e.isFunction(a) && (a(), a = null), e.isFunction(s) && (s(), s = null)
				})
			}
		}
	}]), o.directive("blurAfter", ["$timeout", "IS_MOBILE", function (n, t) {
		return {
			restrict: "A",
			link: function (r, o, i) {
				var a, s, c, u, d = n(1),
					l = !1,
					p = function () {
						e.isFunction(a) && (a(), a = null), e.isFunction(s) && (s(), s = null), e.isFunction(c) && (c(), c = null), e.isFunction(u) && (u(), u = null)
					};
				a = i.$observe("blurAfter", function (e) {
					(e = +e) == e && r.$applyAsync(function () {
						p(), c = o.on("keyup", function () {
							n.cancel(d), l && !t || (d = n(function () {
								o[0].blur()
							}, e))
						}), u = o.on("blur", function () {
							n.cancel(d)
						})
					})
				}), s = i.$observe("mobileOnly", function (e) {
					l = !0 === e || "true" === e || "1" === e || 1 === e
				}), o.on("$destroy", p)
			}
		}
	}]), o.directive("blurOn", ["$timeout", "ValueCleanerService", "IS_MOBILE", function (n, t, r) {
		return {
			restrict: "A",
			link: function (o, i, a) {
				var s, c, u, d, l = n(1),
					p = !1,
					f = function () {
						e.isFunction(s) && (s(), s = null), e.isFunction(c) && (c(), c = null), e.isFunction(u) && (u(), u = null), e.isFunction(d) && (d(), d = null)
					};
				s = a.$observe("blurOn", function (e) {
					(e = t.clear(e, !1)) && o.$applyAsync(function () {
						f(), u = o.$on(e, function () {
							n.cancel(l), p && !r || (l = n(function () {
								i[0].blur()
							}, 10))
						}), d = i.on("blur", function () {
							n.cancel(l)
						})
					})
				}), c = a.$observe("mobileOnly", function (e) {
					p = !0 === e || "true" === e || "1" === e || 1 === e
				}), i.on("$destroy", f)
			}
		}
	}]), o.directive("snwClearInput", ["$timeout", function (n) {
		return {
			restrict: "C",
			scope: !1,
			controller: [function () {
				this.clearInput = e.noop
			}],
			link: function (t, r, o, i) {
				var a = r[0];
				if (e.isFunction(a.querySelector)) {
					var s = a.querySelector(".snw-clear-input__input");
					if (s) {
						var c = !!a.querySelector(".snw-clear-input__empty-icon"),
							u = function (e) {
								var n = s.value || "";
								if (e && 27 === e.keyCode) return i.clearInput();
								n.length ? (r.addClass("snw-clear-input--filled"), c && r.removeClass("snw-clear-input--empty")) : (r.removeClass("snw-clear-input--filled"), c && r.addClass("snw-clear-input--empty"))
							};
						t.$applyAsync(function () {
							i.clearInput = function () {
								t.$apply(function () {
									var n;
									s.value = "", e.isFunction(Event) ? n = new Event("input") : (n = document.createEvent("Event")).initEvent("input", !0, !0), s.dispatchEvent(n), u(), s.focus()
								})
							}, n(u, 500)
						}), s.addEventListener("keyup", u, !1), r.on("$destroy", function () {
							s.removeEventListener("keyup", u, !1)
						})
					}
				}
			}
		}
	}]), o.directive("snwClearInputInput", [function () {
		return {
			restrict: "C",
			scope: !1,
			require: "ngModel",
			link: function (e, n, t, r) {
				n.on("input", function () {
					var e = n.val();
					"" === e && r.$setViewValue(e, "clear")
				}), n.on("$destroy", function () {
					n.off()
				})
			}
		}
	}]), o.directive("snwClearInputFilledIcon", [function () {
		return {
			restrict: "C",
			scope: !1,
			require: "^^snwClearInput",
			link: function (e, n, t, r) {
				n.on("click", function () {
					r.clearInput()
				}), n.on("$destroy", function () {
					n.off()
				})
			}
		}
	}]), o.directive("convertToNumber", function () {
		return {
			restrict: "AC",
			require: "ngModel",
			scope: !1,
			link: function (e, n, t, r) {
				r.$parsers.push(function (e) {
					return parseInt(e, 10)
				}), r.$formatters.push(function (e) {
					return "" + e
				})
			}
		}
	}), o.directive("snwOnChange", [function () {
		return {
			restrict: "A",
			scope: !1,
			link: function (e, n, t) {
				var r = e.$eval(t.snwOnChange);
				n.on("change", r), n.on("$destroy", function () {
					n.off()
				})
			}
		}
	}])
}(window.angular),
function (e, n) {
	"use strict";
	var t = window.angular.module("snwAuthenticate", ["snwCore", "snwHome", "snwModal"]);
	t.provider("snwAuthenticateUser", [function () {
		var e = this,
			n = null,
			t = !1;
		e.getToken = function () {
			return n
		}, e.setToken = function (e) {
			n = e
		}, e.hasToken = function () {
			return !!n
		}, e.setIsFakeUser = function () {
			t = !0
		}, e.isFakeUser = function () {
			return t
		}, e.$get = [function () {
			return {
				hasToken: e.hasToken,
				getToken: e.getToken,
				isFakeUser: e.isFakeUser,
				setIsFakeUSer: e.setIsFakeUser
			}
		}]
	}]), t.directive("snwCallLogin", ["snwAuthenticateUser", "BroadcastService", "SNW_SHOW_PRODUCT_LOGIN_EVENT", function (e, n, t) {
		return {
			restrict: "C",
			replace: !1,
			scope: {},
			link: function (e, r) {
				r.bind("click", function () {
					n.broadcast(t)
				})
			}
		}
	}]), t.controller("ModalLoginController", ["$scope", "SNW_SHOW_PRODUCT_LOGIN_EVENT", "TABLOIDE_ADD_PRODUCT_STORAGE_KEY", function (e, n, t) {
		var r = this;
		r.showLogin = !1, e.$on(n, function () {
			r.showLogin = !0
		}), e.$watch("ctrl.showLogin", function (e, n) {
			!e && n && Lockr.rm(t)
		}, !1)
	}])
}(),
function (e, n) {
	"use strict";
	window.angular.module("snwNotification", ["snwCore"]).controller("NotificationController", ["$http", "SNW_BASE_URL", function (e, n) {
		var t = this;
		t.show = !0, t.closeNotification = function (r) {
			t.show = !1, e.delete([n, "api/v2/current-user/notifications"].join("/"), {
				params: {
					notificationId: r
				}
			})
		}
	}])
}(),
function (e, n, t) {
	"use strict";
	var r = e.module("snwConfig", ["ngSanitize", "ngMessages", "angular-loading-bar", "snwSwal", "snwAuthenticate", "snwNotification", "zendeskWidget", "snwLockr"]);
	r.constant("POSTAL_CODE_LOCAL_STORAGE_KEY", "SNW_CEP"), r.constant("ADDRESS_ID_LOCAL_STORAGE_KEY", "SNW_ADDRESS_ID"), r.constant("ADDRESS_NAME_LOCAL_STORAGE_KEY", "SNW_ADDRESS_NAME"), r.run(["$window", "SNW_APP_ENV", function (n, t) {
		var r = "local" === t ? Function.prototype.bind.call(console.debug, console) : e.noop;
		n.isLocal = function () {
			return "local" === t
		}, n.dd = function () {
			n.isLocal() && r.apply(console, arguments)
		}, n.logger = function () {
			n.isLocal() && r.apply(console, arguments)
		}, n.cookieEnabled = n.navigator.cookieEnabled
	}]), r.config(["$provide", function (n) {
		n.decorator("$q", ["$delegate", function (n) {
			return n.any = function (t) {
				var r = n.defer(),
					o = {},
					i = {},
					a = 0,
					s = !1;
				if (e.isObject(t) && !e.isArray(t)) return e.forEach(t, function (e, n) {
					a++, e.then(function (e) {
						o[n] = e, s = !0
					}, function (e) {
						i[n] = e
					}).finally(function () {
						0 === --a && r[s ? "resolve" : "reject"]({
							resolved: o,
							rejected: i
						})
					})
				}), r.promise;
				throw new Error("$q.any expects promises to be passed as object")
			}, n
		}])
	}]), r.config(["$httpProvider", "$compileProvider", "snwAuthenticateUserProvider", "SNW_BASE_URL", "SNW_APP_ENV", "$sceDelegateProvider", "ZendeskWidgetProvider", function (n, t, r, o, i, a, s) {
		"local" !== i && t.debugInfoEnabled(!1), n.interceptors.push(["$window", "$q", "$swal", "IS_MOBILE", "snwLockrService", function (n, t, i, a, s) {
			return {
				request: function (e) {
					return n.cookieEnabled && e.url.startsWith(o) ? (e.headers["X-Requested-With"] = "XMLHttpRequest", r.hasToken() && (e.headers["X-SNW-TOKEN"] = r.getToken()), e.headers["X-SNW-Version"] = "2020-02-05", a && (e.headers["X-SNW-SOURCE"] = 3), window.ReactNativeWebView && (e.headers["X-SNW-SOURCE"] = 2), e) : e
				},
				response: function (e) {
					return e
				},
				responseError: function (r) {
					var a;
					return r.config.url.startsWith(o) ? r.status < 0 ? e.isObject(r.config) ? t.when(r.config.timeout).then(function (e) {
						return "abort" === e ? (r.statusText = "abort", t.reject(r)) : i.warning("verifique a sua conexão e tente recarregar a página", "Tempo de espera esgotado", {
							reject: r
						})
					}).catch(function (e) {
						return t.reject(e)
					}) : t.reject(r) : 428 === r.status ? i.info("Precisaremos recarregar a página", "Sua sessão expirou", {
						reject: r
					}).finally(function () {
						n.location.reload(!0)
					}) : 401 === r.status ? i.info("Precisaremos recarregar a página", "Sua sessão expirou", {
						reject: r
					}).finally(function () {
						n.location.reload(!0)
					}) : 403 === r.status ? t.reject(r).finally(function () {
						s.rm("USER"), n.location.href = [o, "logout"].join("/")
					}) : 406 === r.status ? t.reject(r) : 423 === r.status ? t.reject(r) : 429 === r.status ? t.reject(r) : 422 === r.status ? t.reject(r) : 404 === r.status ? t.reject(r) : 485 === r.status ? t.reject(r) : 304 === r.status ? i.warning("", "Nenhuma alteração foi feita", {
						reject: r
					}) : 409 === r.status ? (a = [], e.forEach(r.data, function (e) {
						a = a.concat(e)
					}), r.messages = a, i.error(null, a.join(" ") || "Houve um erro com os dados informados", {
						reject: r
					})) : i.warning("Por favor tente novamente", "Falha na conexão", {
						reject: r
					}) : t.reject(r)
				}
			}
		}]), a.resourceUrlWhitelist(["self", "http://app.supermercadonow.com.s3-website-sa-east-1.amazonaws.com/**", "http://app.supermercadonow.com.s3-website-sa-east-1.amazonaws.com/*", "https://app.supermercadonow.com.s3-website-sa-east-1.amazonaws.com/**", "https://app.supermercadonow.com.s3-website-sa-east-1.amazonaws.com/*", "https://d3o3bdzeq5san1.cloudfront.net/*", "https://d3o3bdzeq5san1.cloudfront.net/**"]), s.init({
			accountUrl: "supermercadonow.zendesk.com",
			beforePageLoad: function (e) {
				e.hide()
			}
		})
	}])
}(window.angular, window.Lockr),
function (e, n) {
	"use strict";
	var t = e.module("snwCore", ["snwConfig", "snwCoreUI", "snwLockr", "snwAddCoupon", "snwNowWallet", "snwAddresses", "snwConfigToten", "snwZendeskLogin"]);
	t.constant("SCREEN_SM_MIN", 768), t.constant("SNW_CART_TOGGLE_EVENT", "snw:cart-toggle"), t.constant("TABLOIDE_ADD_PRODUCT_STORAGE_KEY", "TABLOIDE_ADD_PRODUCT"), t.constant("LAST_ORDER_CLOSED_LOCAL_STORAGE_KEY", "SNW_LAST_ORDER_CLOSED"), t.constant("LOOKUP_ORDER_SUBSTITUTION_ID", {
		PENDING: 1,
		OK: 2,
		REPLACED: 3,
		ADJUSTED_QUANTITY: 4,
		UNAVAILABLE: 5,
		NOT_SUITABLE: 6,
		ADJUSTED_PRICE: 7,
		EDITED: 8,
		WAITING_REPLACE: 9
	}), t.controller("CommonController", ["snwLockrService", "$window", "SNW_BASE_URL", function (e, n, t) {
		this.logout = function (r) {
			e.rm("USER"), n.location.href = [t, r].join("/")
		}
	}]), t.factory("RedirectResponse", ["$window", function (e) {
		return function (n) {
			return n = n || "/",
				function (t) {
					return e.location.href = t.data && t.data.redirect ? t.data.redirect : n, t
				}
		}
	}]), t.service("snwRepeatOrderService", ["$swal", "$timeout", "BroadcastService", "snwLockrService", "SNW_CART_TOGGLE_EVENT", function (n, t, r, o, i) {
		var a = function () {
			o.rm("SNW_REPEAT_ORDER")
		};
		return {
			boot: function () {
				a()
			},
			save: function (e) {
				o.set("SNW_REPEAT_ORDER", e)
			},
			hasOrder: function () {
				var s = o.get("SNW_REPEAT_ORDER");
				e.isDefined(s) && (function (e) {
					t(50).then(function () {
						n.success("Produtos do pedido " + e.toString() + " adicionados ao carrinho com sucesso!").then(function () {
							r.broadcast(i, !0)
						})
					})
				}(s), a())
			}
		}
	}]), t.service("snwRecipeService", ["$swal", "$timeout", "BroadcastService", "snwLockrService", "SNW_CART_TOGGLE_EVENT", function (n, t, r, o, i) {
		var a = function () {
			o.rm("SNW_RECIPE")
		};
		return {
			boot: function () {
				a()
			},
			save: function (e) {
				o.set("SNW_RECIPE", e)
			},
			hasRecipe: function () {
				var s = o.get("SNW_RECIPE");
				e.isDefined(s) && (t(50).then(function () {
					n.success("Produtos da receita foram adicionados com sucesso ao carrinho!").then(function () {
						r.broadcast(i, !0)
					})
				}), a())
			}
		}
	}]), t.service("ValueCleanerService", [function () {
		var n = function (n) {
			return function t(r, o) {
				return o = void 0 === _typeof(o) ? null : o, e.isObject(r) || e.isArray(r) ? (e.forEach(r, function (e, n, r) {
					r[n] = t(e)
				}), r) : !0 === n ? r && ("" + (r || "")).replace(/\D/g, "") || o : r && ("" + (r || "")).trim() || o
			}
		};
		this.clear = n(!1), this.digitsOnly = n(!0)
	}]), t.service("snwDateService", [function () {
		return {
			formatWeekdayBR: function (e) {
				switch (e.getDay()) {
					case 0:
						return "domingo";
					case 1:
						return "2ª feira";
					case 2:
						return "3ª feira";
					case 3:
						return "4ª feira";
					case 4:
						return "5ª feira";
					case 5:
						return "6ª feira";
					case 6:
						return "sábado";
					default:
						return null
				}
			},
			isToday: function (e) {
				var n = moment(),
					t = moment(e);
				return n.isSame(t, "day")
			},
			isTomorrow: function (e) {
				var n = moment(e);
				return moment(new Date).add(1, "days").isSame(n, "day")
			}
		}
	}]), t.directive("snwCookieEnabled", ["$window", function (e) {
		return {
			restrict: "EC",
			templateUrl: "popup-cookie.template",
			link: function (n) {
				var t = !0;
				n.open = function () {
					return !e.cookieEnabled && t
				}, n.close = function () {
					t = !1
				}
			}
		}
	}])
}(window.angular), Array.prototype.reduce || (Array.prototype.reduce = function (e) {
		"use strict";
		if (null == this) throw new TypeError("Array.prototype.reduce called on null or undefined");
		if ("function" != typeof e) throw new TypeError(e + " is not a function");
		var n, t = Object(this),
			r = t.length >>> 0,
			o = 0;
		if (2 == arguments.length) n = arguments[1];
		else {
			for (; o < r && !(o in t);) o++;
			if (o >= r) throw new TypeError("Reduce of empty array with no initial value");
			n = t[o++]
		}
		for (; o < r; o++) o in t && (n = e(n, t[o], o, t));
		return n
	}),
	function (e, n, t) {
		"use strict";
		var r = window.angular.module("snwGoogleTagManager", ["angular-inview"]),
			o = [];
		r.service("GoogleTagManager", function () {
			var n = this,
				t = /iPad/.test(navigator.userAgent) ? "t" : /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Silk/.test(navigator.userAgent) ? "m" : "d";
			n.registerUser = function (n) {
				try {
					_egoiaq.push(["setSubscriber", n.email]), _egoiaq.push(["setCampaignId", "216"]), _egoiaq.push(["trackGoal", 4]), _egoiaq.push(["trackPageView"]), e.dataLayer.push({
						event: "sign-up",
						email: n.email,
						id: n.id
					})
				} catch (e) {}
			}, n.registerUserPrime = function (n) {
				try {
					e.dataLayer.push({
						event: "Prime_sign-up",
						email: n.email,
						id: n.id
					})
				} catch (e) {}
			}, n.checkoutReviewCart = function () {
				try {
					e.dataLayer.push({
						event: "checkout",
						page_type: "checkout",
						ecommerce: {
							checkout: {
								actionField: {
									step: 1
								}
							}
						}
					})
				} catch (e) {}
			}, n.criteoProductpage = function (n, r) {
				try {
					e.dataLayer.push({
						event: "ProductPage",
						PageType: "ProductPage",
						email: n,
						site_type: t,
						product_id: r
					})
				} catch (e) {}
			}, n.criteoHomepage = function (n) {
				try {
					e.dataLayer.push({
						event: "HomePage",
						PageType: "HomePage",
						email: n,
						site_type: t
					})
				} catch (e) {}
			}, n.criteoBasketpage = function (n, r) {
				try {
					e.dataLayer.push({
						event: "BasketPage",
						PageType: "BasketPage",
						email: n,
						site_type: t,
						products_info: r
					})
				} catch (e) {}
			}, n.checkoutUserInfo = function () {
				try {
					e.dataLayer.push({
						event: "checkout",
						page_type: "checkout",
						ecommerce: {
							checkout: {
								actionField: {
									step: 2
								}
							}
						}
					})
				} catch (e) {}
			}, n.checkoutDelivery = function () {
				try {
					e.dataLayer.push({
						event: "checkout",
						page_type: "checkout",
						ecommerce: {
							checkout: {
								actionField: {
									step: 3
								}
							}
						}
					})
				} catch (e) {}
			}, n.checkoutPayment = function () {
				try {
					e.dataLayer.push({
						event: "checkout",
						page_type: "checkout",
						ecommerce: {
							checkout: {
								actionField: {
									step: 4
								}
							}
						}
					})
				} catch (e) {}
			}, n.addCartEgoi = function (e, n, t) {
				try {
					_egoiaq.push(["setClientId", "445493"]), _egoiaq.push(["setListId", "4"]), _egoiaq.push(["setCampaignId", "216"]), _egoiaq.push(["setSubscriber", t]), angular.forEach(e, function (e) {
						_egoiaq.push(["addEcommerceItem", e.product_store_id.toString(), e.name, e.brand, e.price, e.quantity])
					}), _egoiaq.push(["trackEcommerceCartUpdate", n]), _egoiaq.push(["trackPageView"])
				} catch (e) {}
			}, n.addCartTagManager = function (t, r) {
				try {
					_egoiaq.push(["setClientId", "445493"]), _egoiaq.push(["setListId", "4"]), _egoiaq.push(["setCampaignId", "216"]), _egoiaq.push(["setSubscriber", r]), _egoiaq.push(["trackGoal", 8]), _egoiaq.push(["trackPageView"]), e.dataLayer.push({
						event: "addToCart",
						page_type: "product",
						ecommerce: {
							currencyCode: "BRL",
							add: {
								products: [{
									name: t.name,
									id: t.product_id,
									price: t.price,
									brand: t.brand,
									category: t.category_slug,
									quantity: 1
								}]
							}
						}
					}), n.productViewPush()
				} catch (e) {}
			}, n.addCartRepeatOrder = function (n) {
				var t = [];
				try {
					angular.forEach(n, function (e) {
						e.in_stock && t.push({
							name: e.name,
							id: e.product_id,
							price: e.price,
							brand: e.brand,
							category: e.category,
							quantity: e.quantity
						})
					}), e.dataLayer.push({
						event: "addToCart",
						page_type: "product",
						ecommerce: {
							currencyCode: "BRL",
							add: {
								products: t
							}
						}
					})
				} catch (e) {}
			}, n.removeCartTagManager = function (t) {
				try {
					e.dataLayer.push({
						event: "removeFromCart",
						ecommerce: {
							remove: {
								products: [{
									name: t.name,
									id: t.product_id,
									price: t.price,
									brand: t.brand,
									category: t.category_slug,
									quantity: 1
								}]
							}
						}
					}), n.productViewPush()
				} catch (e) {}
			}, n.removeAllCartTagManager = function (t) {
				try {
					e.dataLayer.push({
						event: "removeFromCart",
						ecommerce: {
							remove: {
								products: [{
									name: t.name,
									id: t.product_id,
									price: t.price,
									brand: t.brand,
									category: t.category_slug,
									quantity: t.quantity
								}]
							}
						}
					}), n.productViewPush()
				} catch (e) {}
			}, n.purchaseSuccess = function (n) {
				if (4 == n.store_id) try {
					e.dataLayer.push({
						event: "QuitandaConversion",
						PageType: "QuitandaConversion",
						transaction_id: n.order_id,
						send_to: "AW-798074047/VO2kCMPm3IUBEL_JxvwC"
					})
				} catch (e) {}
				try {
					_egoiaq.push(["setCampaignId", "216"]), _egoiaq.push(["trackEcommerceOrder", n.order_id, n.revenue]), _egoiaq.push(["trackPageView"]), e.dataLayer.push({
						event: "checkout-sucesso",
						qtdItens: n.size,
						freteValor: n.shipping,
						valorTotal: n.revenue,
						order_id: n.order_id,
						pagamento: n.payment_method,
						user_id: n.user_id,
						first_order: n.first_order,
						mercado_id: n.store_id,
						mercado_nome: n.store
					})
				} catch (e) {}
			}, n.productView = function (e, n) {
				try {
					o.push({
						name: n.name,
						id: n.product_store_id,
						price: n.price,
						brand: n.brand,
						category: n.category_slug
					})
				} catch (e) {}
			}, n.productViewPush = function () {
				try {
					o.length > 0 && (e.dataLayer.push({
						event: "productView",
						page_type: "product",
						ecommerce: {
							detail: {
								products: o
							}
						}
					}), e.dataLayer.push({
						event: "ListingPage",
						PageType: "ListingPage",
						email: null,
						site_type: t,
						products: o
					}), o = [])
				} catch (e) {}
			}, n.productSearchPageView = function (n) {
				try {
					var t = n.substr("https://www.supermercadonow.com".length);
					e.dataLayer.push({
						event: "productSearchPageView",
						page_type: "product",
						partialViewPath: t
					})
				} catch (e) {}
			}, n.sendUserInfo = function (n, t) {
				try {
					e.dataLayer.push({
						userID: n,
						dlIsNewClient: t
					})
				} catch (e) {}
			}, n.sendStoreInfo = function (n, t) {
				try {
					e.dataLayer.push({
						dlStoreName: n,
						dlStoreBrandName: t
					})
				} catch (e) {}
			}
		})
	}(window),
	function (e, n, t) {
		"use strict";
		n.module("snwWebGeolocation", ["snwCore"]).service("WebGeolocation", ["$http", "$swal", "$q", "$window", "SNW_BASE_URL", function (e, t, r, o, i) {
			var a = {
					enableHighAccuracy: !0,
					timeout: 5e3,
					maximumAge: 0
				},
				s = function (a) {
					var s = a.coords.latitude,
						c = a.coords.longitude;
					return e.post([i, "api/admin/order/shopper-verification"].join("/"), {
						latitude: s,
						longitude: c,
						is_online: !0
					}).then(function (e) {
						return e.data.is_active ? t.success("Sucesso, você está apto a receber pedidos!", "").then(function () {
							return o.location.reload(), !0
						}) : t.warning("Você não está próximo a uma loja ou confirmado na escala")
					}).catch(function (e) {
						return n.isObject(e) && n.isArray(e.messages) ? t.warning(e.messages.join("/")) : r.reject()
					})
				},
				c = function (e) {};
			this.getPosition = function () {
				return r.when(navigator.geolocation.getCurrentPosition(s, c, a))
			}
		}])
	}(window, window.angular),
	function (e, n) {
		"use strict";
		var t = window.angular.module("snwAddCoupon", ["snwCore", "snwSwal", "snwLockr"]);
		t.controller("AddCouponController", ["$http", "$q", "$swal", "$timeout", "snwLockrService", "SNW_BASE_URL", "snwCoupon", "BroadcastService", function (e, n, t, r, o, i, a, s) {
			var c = this;
			c.addCoupon = function (r) {
				t.prompt("", "Você tem um cupom :)", {
					inputPlaceholder: "Insira seu cupom aqui",
					imageUrl: "/images/institutional/menu/icone_popup_cupom.svg",
					imageSize: "110x110",
					customClass: "snw-swal coupon-swal",
					inputValue: r
				}).then(function (n) {
					return e.post([i, "api/v2/discounts/coupons"].join("/"), {
						coupon: n
					})
				}).then(function (e) {
					return s.broadcast("coupon:change"), "success" == e.data.type ? t.success(e.data.message, e.data.title) : "warning" == e.data.type ? t.warning(e.data.message, e.data.title) : void 0
				}).catch(function (e) {
					var r;
					return e && 406 === e.status ? (r = e.data.errors.map(function (e) {
						return e.message
					}).join(" \n "), t.error("", r, {
						reject: !0
					})) : n.reject(!1)
				}).catch(function () {
					return n.reject(!1)
				})
			}, a.hasCoupon() && r(function () {
				c.addCoupon(a.getCoupon())
			}, 1500)
		}]), t.provider("snwCoupon", [function () {
			var e = this,
				n = null;
			e.getCoupon = function () {
				return n
			}, e.setCoupon = function (e) {
				n = e
			}, e.hasCoupon = function () {
				return !!n
			}, e.$get = [function () {
				return {
					hasCoupon: e.hasCoupon,
					getCoupon: e.getCoupon
				}
			}]
		}])
	}(),
	function (e, n) {
		"use strict";
		window.angular.module("snwConfigToten", ["snwCore", "snwSwal", "snwLockr"]).controller("TotenController", ["$swal", "snwLockrService", function (e, n) {
			var t = this;
			t.totenModal = !1, t.toten = null, t.toggleModal = function () {
				t.totenModal = !t.totenModal
			}, t.setToten = function () {
				t.toten ? (n.set("TOTEN_ID", t.toten), e.success("Totem configurado com sucesso!", "Sucesso").then(function () {
					t.toggleModal()
				})) : e.error("Selecione um local!", "Erro")
			}
		}])
	}(),
	function (e, n) {
		"use strict";
		var t = e.module("snwNowWallet", ["snwCore", "snwSwal", "snwCreditCard", "snwPaymentTokenizer", "snwAddressCompleter"]);
		t.provider("snwNowWalletOrder", [function () {
			var e = this,
				n = null;
			e.getOrder = function () {
				return n
			}, e.setOrder = function (e) {
				n = e
			}, e.hasOrder = function () {
				return !!n
			}, e.$get = [function () {
				return {
					hasOrder: e.hasOrder,
					getOrder: e.getOrder
				}
			}]
		}]), t.controller("NowWalletController", ["$scope", "$rootScope", "$http", "$q", "$swal", "$timeout", "SNW_BASE_URL", "BroadcastService", "AddressCompleter", "snwNowWalletOrder", "PaymentGatewayService", "CreditCardHelperService", "IS_MOBILE", function (n, t, r, o, i, a, s, c, u, d, l, p, f) {
			var m = this;
			t.subMenuLength = 0, t.currentSubMenu = null, t.previousSubMenu = null, m.loading = !1, m.backButton = !1, m.showCreditCardModal = !1, m.nowCreditos = null, m.creditCards = null, m.addresses = null, m.rotateCard = !1, m.minimizeCardNumber = !1, m.showErrors = !1, m.card = {}, m.showSelectedCard = !1, m.orderCreditCard = {}, m.toggleCreditCardModal = function () {
				m.showCreditCardModal = !m.showCreditCardModal, m.getData()
			}, m.getData = function () {
				m.clearData(), m.showCreditCardModal && (d.hasOrder() || r.get([s, "api/v2/discounts/credits"].join("/")).then(function (e) {
					m.nowCreditos = e.data
				}), m.getCreditCards()), m.visible && m.getCreditCards()
			}, m.getCreditCards = function () {
				return o.when(!0).then(function () {
					return r.get([s, "api/v2/current-user/credit-cards"].join("/"))
				}).then(function (e) {
					m.creditCards = e.data, m.changeState(0)
				}).then(function () {
					return d.hasOrder() ? r.get([s, "api/v2/current-user/credit-cards/order", d.getOrder()].join("/")) : o.reject(!1)
				}).then(function (e) {
					m.showSelectedCard = !0, m.orderCreditCard = e.data
				})
			}, m.getAddresses = function () {
				r.get([s, "api/v2/addresses"].join("/")).then(function (e) {
					m.addresses = e.data
				})
			}, m.changeState = function (e) {
				switch (m.state = e, e) {
					case 0:
						m.modalTitle = "Now Wallet", m.backButton = !1;
						break;
					case 1:
					case 2:
						m.modalTitle = "Adicionar novo", m.backButton = !0;
						break;
					case 3:
						m.modalTitle = "Endereço de cobrança", m.backButton = !0
				}
				$("#wallet-carousel").carousel(e)
			}, m.cardNumberSubstring = function (e) {
				if (!m.card.original_card_number) return null;
				var n = 4 * (e - 1),
					t = e > 3 ? m.card.original_card_number.length : n + 4;
				return m.card.original_card_number.substring(n, t)
			}, m.toggleOptions = function (e) {
				e.showOptions = !e.showOptions
			}, m.removeCardPopup = function (e, n) {
				e.showOptions = !1;
				var t = null;
				if (m.isOrderCreditCard(e)) return i.warning("Não é possível remover o cartão ativo", "Atenção");
				r.get([s, "api/v2/current-user"].join("/")).then(function (e) {
					if ((t = e.data) && t.subscriptions && t.subscriptions.length)
						for (var n = 0; n < t.subscriptions.length; n++)
							if (t.subscriptions[n].active) return !0;
					return !1
				}).then(function (t) {
					t && 1 == m.creditCards.length && (n = "Tem certeza que deseja remover seu cartão? \nAo removê-lo, sua assinatura Now Prime será cancelada ao final do período."), i.message(n, "Remover cartão", {
						showCancelButton: !0,
						confirmButtonText: "Remover",
						cancelButtonText: "Voltar",
						imageSize: "110x110",
						imageUrl: "/images/common/card/img-popup-remove-card.svg"
					}).then(function () {
						r.delete([s, "api/v2/current-user/credit-cards", e.id].join("/")).then(function (e) {
							m.creditCards = e.data
						}).catch(function (e) {
							i.error(e.data.errors[0].message, "")
						})
					})
				})
			}, m.removeCard = function (e) {
				m.removeCardPopup(e, "Tem certeza que deseja remover este cartão do seu Now Wallet?")
			}, m.removeExpiredCard = function (e) {
				m.removeCardPopup(e, "Seu cartão já expirou a data de validade.\nRemova-o e adicione outro à sua conta")
			}, m.isExpirated = function (e) {
				return !(!e.card_maturity_month || !e.card_maturity_year) && !!moment(e.card_maturity_month + "/" + e.card_maturity_year, "MM/YYYY").endOf("month").isBefore(moment())
			}, m.cardIsValid = function () {
				return !!(m.card.card_number && m.card.card_number.length >= 15)
			}, m.cardBrand = function () {
				return p.cardBrand(m.card.original_card_number)
			}, m.getMessage = function () {
				switch (m.formState) {
					case 0:
						return "Vamos começar com o <strong>número do seu cartão</strong>";
					case 1:
						return "Obrigado! Agora insira o <strong>nome do titular</strong><br>exatamente como está escrito no cartão";
					case 2:
						return "Ótimo! Agora informe a <strong>data de validade</strong>";
					case 3:
						return "Quase lá! Só falta inserir o <strong>código de<br>segurança (CVC)</strong> do cartão";
					case 4:
						return "Precisamos que insira o <strong>CPF do titular</strong>";
					case 5:
						return "Agora só falta o <strong>celular do titular</strong>";
					case 6:
						return "Obrigado por inserir todas as informações!<br>Confira os campos e <strong>clique em continuar</strong>"
				}
			}, m.continueIsDisabled = function () {
				return !m.card.original_card_number || m.card.original_card_number.length < 14 || !m.cardBrand() || (!m.card.card_owner || (!m.card.card_expiration && !m.isConductor() || ((!m.card.card_cvc || m.card.card_cvc.length < 3) && !m.isConductor() || (!m.card.card_document || !m.card.card_phone))))
			}, m.editAddressIsDisabled = function () {
				return !(m.address && m.address.street_number && m.address.name)
			}, m.continue = function () {
				m.continueIsDisabled() ? m.showErrors = !0 : (m.changeState(2), m.getAddresses())
			}, m.editAddress = function () {
				var e = {
					url: [s, "api/v2/addresses"].join("/"),
					method: "POST",
					data: m.address
				};
				m.address.id && (e.url = [e.url, m.address.id].join("/"), e.method = "PUT"), m.loading = !0, r(e).then(function (e) {
					m.address = e.data, m.address_id = m.address.id, i.success("Endereço salvo com sucesso", "").then(function () {
						m.changeState(2), m.getAddresses()
					})
				}).catch(function () {
					i.error("Ocorreu um erro ao salvar o endereço. Por favor, tente novamente", "Erro")
				}).finally(function () {
					m.loading = !1
				})
			}, m.addCard = function () {
				m.loading = !0;
				var e = "",
					n = "";
				m.isConductor() || (e = m.card.card_expiration.split("/")[0], n = m.card.card_expiration.split("/")[1]), l.canTokenize().then(function (t) {
					l.requestToken(m.card.card_owner, m.card.original_card_number, e, n, m.card.card_cvc, m.card.card_document).then(function (t) {
						m.loading = !1, m.isConductor() || (n = parseInt("20" + n));
						var o = {
							card: {
								brand: m.cardBrand(),
								name: m.card.card_owner,
								bin_number: m.card.original_card_number.slice(0, 6),
								number: m.card.original_card_number.slice(-4),
								maturity_month: parseInt(e),
								maturity_year: n,
								document: m.card.card_document,
								phone_area_code: m.card.card_phone.slice(0, 2),
								phone_number: m.card.card_phone.slice(2),
								nick: m.card.card_name,
								stripe_token: t.stripe_token,
								zoop_token: t.zoop_token,
								iugu_token: t.iugu_token,
								conductor_token: t.conductor_token,
								adyen_token: t.adyen_token
							},
							address: m.address
						};
						i.message("Para <strong>confirmar a validade</strong> do cartão,<br>faremos uma cobrança de <strong>R$ 1,00</strong> com a descrição <strong>STP*SUPERNOW.</strong><br><br>Não se preocupe pois esse valor será <strong>automaticamente reembolsado</strong> em até <strong>2 dias úteis</strong>", "Confirmação de Cartão", {
							showCancelButton: !0,
							html: !0,
							confirmButtonText: "OK",
							cancelButtonText: "Voltar",
							imageSize: "110x110",
							imageUrl: "/images/common/card/img-popup-confirmacao-cartao.svg"
						}).then(function () {
							m.loading = !0, r.post([s, "api/v2/current-user/credit-cards"].join("/"), o).then(function (e) {
								m.changeState(0), d.hasOrder() ? m.setOrder(e.data) : m.getData()
							}).catch(function () {
								i.message("Houve algum erro no processamento do seu cartão. Verifique se as informações estão corretas e tente de novo.<br><br>Se não funcionar, entre em contato com seu banco para ver o que ocorreu.", "Oops!", {
									html: !0,
									confirmButtonText: "Revisar",
									imageSize: "110x110",
									imageUrl: "/images/common/card/img-popup-sadface.svg"
								}).then(function () {
									m.changeState(1)
								})
							}).finally(function () {
								m.loading = !1
							})
						})
					}).catch(function (e) {
						return e = e.map(function (e) {
							switch (e) {
								case "brand":
									return "Bandeira do cartão inválida";
								case "number":
									return "Número do cartão inválido";
								case "csc":
									return "Código de segurança inválido";
								case "expiration":
									return "Data de validade inválida";
								case "name":
									return "Nome do titular do cartão inválido";
								case "transaction":
									return "Erro na comunicação com a operadora de cartão de crédito";
								case "cpf":
									return "CPF do cartão inválido";
								default:
									return "Erro inesperado"
							}
						}), i.error(e.join(" / "), "Transação negada", {
							reject: !0
						})
					}).finally(function () {
						m.loading = !1
					})
				}).catch(function (e) {
					i.error(e.data.message, "Atenção").then(function () {
						m.loading = !1
					})
				})
			}, m.selectOrEdit = function (e) {
				if (m.address = e, void 0 === e && (e = null), e && e.street_number) return m.address_id = e.id, m.scrollToBottom(), !0;
				m.changeState(3)
			}, m.scrollToBottom = function () {
				var e = $(".active"),
					n = $("#nowWalletAddress");
				f && (e = $(".snw-modal"), n = $("#wallet-carousel")), e.animate({
					scrollTop: n.height()
				})
			}, m.addressList = function () {
				m.address && m.address.street_number || (m.address = null), m.changeState(2)
			}, m.verifyPostalCode = function () {
				m.address.postal_code && u.findByPostalCode(m.address.postal_code).then(function (e) {
					m.address.street_name = e.street_name, m.address.state_id = e.state_id, m.address.zone = e.zone, m.address.city_name = e.city_name, m.address.city_id = e.city_id
				})
			}, m.setMinimizeCard = function (e) {
				m.minimizeCardNumber = e, m.card.card_number = m.card.original_card_number, e && (m.card.card_number = m.cardNumberSubstring(4), a(function () {
					$("#card_owner").focus()
				}, 500))
			}, m.clearData = function () {
				m.card = {}, m.address = null, m.address_id = null, m.formState = 0, m.rotateCard = !1, m.minimizeCardNumber = !1
			}, m.selectCard = function (n) {
				e.extend(m.currentCreditCard, n), m.visible = !1, r.get([s, "api/v2/checkout/installment"].join("/"), {
					params: {
						creditCardBrand: n.card_brand,
						creditCardId: n.id
					}
				}).then(function (n) {
					e.extend(m.currentCreditCard, n.data, {
						installment: 1
					})
				})
			}, m.setOrder = function (e) {
				return !!d.hasOrder() && (!!m.isOrderCreditCard(e) || void r.post([s, "api/v2/current-user/credit-cards", e.id, "order", d.getOrder()].join("/"), {}).then(function () {
					m.getData()
				}))
			}, m.isOrderCreditCard = function (e) {
				return m.orderCreditCard && m.orderCreditCard.id === e.id
			}, m.cardMaxLength = function () {
				return m.cardBrand() ? "Aura" == m.cardBrand() ? 23 : "Amex" == m.cardBrand() ? 18 : 19 : null
			}, m.enterKey = function (e) {
				13 === e.keyCode && (1 !== m.state || !m.cardIsValid() || m.minimizeCardNumber ? 1 !== m.state || !m.minimizeCardNumber || m.continueIsDisabled() ? 2 !== m.state || !m.address || m.loading ? 3 !== m.state || m.editAddressIsDisabled() || m.loading || m.editAddress() : m.addCard() : m.continue() : m.setMinimizeCard(!0))
			}, m.fieldIsInvalid = function (e) {
				return (e.$dirty || m.showErrors) && e.$invalid
			}, m.isConductor = function () {
				return "Confianca" === m.cardBrand()
			}, m.back = function () {
				m.state > 0 && m.changeState(m.state - 1)
			}, n.$on("MODAL_BACK", function () {
				m.back()
			}), n.$watch("ctrl.visible", function () {
				m.visible && m.getCreditCards()
			})
		}]), t.directive("snwChooseCard", [function () {
			return {
				restrict: "C",
				scope: {
					currentCreditCard: "=",
					visible: "="
				},
				templateUrl: "choose-card.template",
				controllerAs: "ctrl",
				bindToController: !0,
				controller: "NowWalletController"
			}
		}])
	}(window.angular),
	function (e, n, t) {
		"use strict";
		var r = e.module("snwAddresses", ["snwCore", "snwSwal", "snwAddressCompleter"]);
		r.provider("snwAddressesOrder", [function () {
			var e = this,
				n = null;
			e.getOrder = function () {
				return n
			}, e.setOrder = function (e) {
				n = e
			}, e.hasOrder = function () {
				return !!n
			}, e.$get = [function () {
				return {
					hasOrder: e.hasOrder,
					getOrder: e.getOrder
				}
			}]
		}]), r.controller("AddressesController", ["$scope", "$rootScope", "$http", "$swal", "SNW_BASE_URL", "AddressCompleter", "BroadcastService", "snwAddressesOrder", "POSTAL_CODE_LOCAL_STORAGE_KEY", "ADDRESS_ID_LOCAL_STORAGE_KEY", "ADDRESS_NAME_LOCAL_STORAGE_KEY", function (t, r, o, i, a, s, c, u, d, l, p) {
			var f = this;
			f.loading = !1, f.backButton = !1, f.showAddressesModal = !1, f.needsAdditionalInfo = !1, f.showErrors = !1, f.toggleAddressesModal = function () {
				f.showAddressesModal = !f.showAddressesModal, f.showAddressesModal && f.getAddresses()
			}, f.getAddresses = function (e) {
				f.clearData(), o.get([a, "api/v2/addresses"].join("/")).then(function (n) {
					if (f.addresses = f.verifyAddresses(n.data), f.changeState(0), e) {
						var t = f.addresses.filter(function (n) {
							return n.id == e
						});
						f.changeAddress(t[0], !0)
					}
				})
			}, f.verifyAddresses = function (e) {
				var n = e.filter(function (e) {
						return 1 == e.lookup_address_type_id
					}),
					t = e.filter(function (e) {
						return 2 == e.lookup_address_type_id
					});
				if (!n.length) {
					e.push({
						name: "Casa",
						lookup_address_type_id: 1
					})
				}
				if (!t.length) {
					e.push({
						name: "Trabalho",
						lookup_address_type_id: 2
					})
				}
				return e
			}, f.changeAddress = function (e, t) {
				if (e) {
					var r = window.location.pathname.startsWith("/estamos-chegando/");
					if (e.accepted_in_current_store || r) {
						var s = [a, "api/v2/addresses", e.id];
						u.hasOrder() && (s.push("order"), s.push(u.getOrder())), o.post(s.join("/"), {}).then(function () {
							f.saveAddress(e), c.broadcast("snw:address-change"), t || (f.showAddressesModal = !1), r && (window.location.href = "/mercados")
						})
					} else i.message("Você pode escolher um novo mercado ou usar outro endereço.", "Esta loja não atende o endereço selecionado", {
						showCancelButton: !0,
						confirmButtonText: "Escolher outro mercado",
						cancelButtonText: "Voltar",
						imageSize: "110x110",
						imageUrl: "/images/common/img-popup-mercado.svg"
					}).then(function () {
						o.post([a, "api/v2/addresses", e.id].join("/")).then(function () {
							f.saveAddress(e), window.location.href = "/mercados"
						})
					}).catch(function () {
						f.address_id = n.get(l), f.address_name = n.get(p)
					})
				}
			}, f.saveAddress = function (e) {
				f.address_id = e.id, f.address_name = e.street_name, e.street_number && (f.address_name += ", " + e.street_number), n.set(l, e.id), n.set(p, f.address_name), n.set(d, e.postal_code)
			}, f.removeAddress = function (e) {
				var n = "Tem certeza que deseja remover\n" + (e.name ? e.name : "Sem nome") + " dos seus endereços?";
				i.message(n, "Remover endereço", {
					showCancelButton: !0,
					confirmButtonText: "Remover",
					cancelButtonText: "Voltar",
					imageSize: "110x110",
					imageUrl: "/images/common/icon-adress.svg"
				}).then(function () {
					o.delete([a, "api/v2/addresses", e.id].join("/")).then(function (e) {
						f.addresses = f.verifyAddresses(e.data)
					}).catch(function (e) {
						e.data.errors && e.data.errors.length && i.error(e.data.errors[0].message)
					})
				})
			}, f.toggleOptions = function (e) {
				e.showOptions = !e.showOptions
			}, f.changeState = function (e) {
				switch (f.state = e, e) {
					case 0:
						f.modalTitle = "Onde vamos entregar?", f.backButton = !1;
						break;
					case 1:
						f.modalTitle = "Cadastro de endereço", f.backButton = !0
				}
				$("#address-carousel").carousel(e)
			}, f.verifyCurrentAddress = function () {
				var e = [a, "api/v2/addresses"];
				u.hasOrder() ? (e.push("order"), e.push(u.getOrder())) : e.push("current"), o.get(e.join("/")).then(function (e) {
					f.address_id = e.data.id, f.address_name = e.data.street_name, e.data.street_number && (f.address_name += ", " + e.data.street_number)
				})
			}, f.verifyPostalCode = function () {
				f.address.postal_code && s.findByPostalCode(f.address.postal_code).then(function (e) {
					f.address.street_name = e.street_name, f.address.state_id = e.state_id, f.address.zone = e.zone, f.address.city_name = e.city_name, f.address.city_id = e.city_id, f.needsAdditionalInfo = !1, e.street_name && e.zone || (f.needsAdditionalInfo = !0)
				})
			}, f.editAddress = function () {
				if (f.editAddressIsDisabled()) f.showErrors = !0;
				else {
					var e = {
						url: [a, "api/v2/addresses"].join("/"),
						method: "POST",
						data: f.address
					};
					f.address.id && (e.url = [e.url, f.address.id].join("/"), e.method = "PUT"), f.loading = !0, o(e).then(function (e) {
						f.address_id == f.address.id && f.saveAddress(e.data), i.success("Endereço salvo com sucesso", "").then(function () {
							f.getAddresses(e.data.id)
						})
					}).catch(function () {
						i.error("Ocorreu um erro ao salvar o endereço. Por favor, tente novamente", "Erro")
					}).finally(function () {
						f.loading = !1
					})
				}
			}, f.addAddress = function () {
				f.address = {}, f.changeState(1)
			}, f.edit = function (n) {
				f.address = e.copy(n), f.changeState(1)
			}, f.clearData = function () {
				f.address = {}, f.address_form.$setPristine()
			}, f.enterKey = function (e) {
				13 === e.keyCode && (1 !== f.state || f.editAddressIsDisabled() || f.loading || f.editAddress())
			}, f.fieldIsInvalid = function (e) {
				return (e.$dirty || f.showErrors) && e.$invalid
			}, r.$on("MODAL_BACK", function () {
				f.state > 0 && f.changeState(f.state - 1)
			}), r.$on("snw:local-address-change", function () {
				f.address_id = n.get(l), f.address_name = n.get(p)
			}), r.addressSort = function (e) {
				return e.id === f.address_id ? 0 : e.lookup_address_type_id
			}, f.editAddressIsDisabled = function () {
				return !(f.address && f.address.postal_code && f.address.street_name && f.address.street_number && f.address.zone && f.address.name && f.address.additional_info)
			}, f.verifyCurrentAddress(), t.$on("snw:address-modal-open", function () {
				f.toggleAddressesModal()
			})
		}])
	}(window.angular, window.Lockr),
	function (e, n) {
		"use strict";
		var t = e.module("snwNgForm", []);
		t.directive("ngForm", ["$parse", "$timeout", function (n, t) {
			return {
				link: function (r, o, i) {
					var a = function (e) {
						for (var n = [e.find("button"), e.find("input")], t = 0; t < n.length; t++)
							for (var r = 0; r < n[t].length; r++) {
								var o = n[t][r];
								if (o.getAttribute("type") && "submit" === o.getAttribute("type").toLowerCase()) return o
							}
					}(o);
					o.bind("keydown", function (e) {
						13 === (e.keyCode || e.which) && ("input" === e.target.nodeName.toLowerCase() && (i.ngSubmit ? (n(i.ngSubmit)(r, {
							$event: e
						}), e.stopPropagation(), e.preventDefault()) : a && (a.click(), e.stopPropagation(), e.preventDefault())))
					}), e.element(a).bind("click", function (a) {
						i.ngSubmit && void 0 === e.element(this).attr("ng-click") && (n(i.ngSubmit)(r, {
							$event: a
						}), a.stopPropagation(), a.preventDefault(), t(function () {
							r[i.ngForm || i.name] && (r[i.ngForm || i.name].$submitted = !0), o.addClass("ng-submitted")
						}))
					})
				}
			}
		}]), t.directive("onEnter", ["$parse", function (e) {
			return {
				link: function (n, t, r) {
					t.bind("keyup", function (t) {
						13 === (t.keyCode || t.which) && r.onEnter && e(r.onEnter)(n, {
							$event: t
						})
					})
				}
			}
		}])
	}(window.angular),
	function (e, n, t) {
		"use strict";
		var r = function e(t, r, o) {
			var i;
			n.isArray(o) || null !== (i = o) && "object" === _typeof(i) && Object.getPrototypeOf(i) === Object.prototype ? n.forEach(o, function (n, o) {
				e(t, r + "[" + o + "]", n)
			}) : null != o && t.append(r, o)
		};
		e.buildFormData = function (e, t) {
			t = n.isArray(t) ? t : [];
			var o = new FormData;
			return n.forEach(e, function (e, n) {
				-1 === t.indexOf(n) && r(o, n, e)
			}), o
		}
	}(window, angular),
	function (e, n) {
		"use strict";
		window.angular.module("snwZendeskLogin", ["snwCore", "snwLockr", "zendeskWidget"]).controller("ZendeskController", ["$http", "SNW_BASE_URL", "snwLockrService", "ZendeskWidget", function (e, n, t, r) {
			var o = null;
			this.boot = function () {
				e.get([n, "api/v2/current-user/"].join("/")).then(function (e) {
					(o = e.data) && (t.set("USER", JSON.stringify(o)), r.identify({
						name: o.name + " " + o.last_name,
						email: o.email
					}))
				})
			}, this.boot()
		}])
	}(),
	function (e, n) {
		"use strict";
		window.angular.module("snwLogErrors", []).service("LogErrors", ["$q", "$http", "SNW_BASE_URL", function (e, n, t) {
			this.tokenizationErrors = function (r, o) {
				var i = e.defer(),
					a = [t, "api/current-user/tokenization-error"].join("/"),
					s = {
						gateway: r,
						reason: o
					};
				return n.post(a, s).then(function (e) {
					i.resolve(e.data)
				}).catch(function (e) {
					i.reject(e)
				}), i.promise
			}
		}])
	}(),
	function (e, n) {
		"use strict";
		var t = e.module("snwHome", ["snwCore", "snwChangeAddress", "snwDownloadApp", "snwInstitutionalComingSoon", "snwLockr", "snwGoogleTagManager"]);
		t.constant("SNW_HOME_FOCUS", "snw:home-focus"), t.provider("snwRedirectService", [function () {
			var e, n = this;
			n.setRedirect = function (n) {
				e = n
			}, n.getRedirect = function (n) {
				return e || n
			}, n.$get = [function () {
				return {
					setRedirect: n.setRedirect,
					getRedirect: n.getRedirect
				}
			}]
		}]), t.controller("HomeController", ["$scope", "$window", "$http", "$q", "$swal", "IsInvalidModel", "AddModelErrorsFromServer", "BroadcastService", "RedirectResponse", "LocateService", "snwLockrService", "snwRedirectService", "SNW_BASE_URL", "SNW_HOME_FOCUS", "POSTAL_CODE_LOCAL_STORAGE_KEY", "IS_MOBILE", "SNW_RECAPTCHA_KEY", "GoogleTagManager", function (n, t, r, o, i, a, s, c, u, d, l, p, f, m, g, v, h, w) {
			var _ = this;
			_.postal_code = "", _.city = "", _.name = "", _.last_name = "", _.email = "", _.password = "", _.terms = !1, _.accept_marketing_messages = !0;
			var C = 0,
				y = 1,
				b = 2,
				E = C,
				S = [f, "mercados/localizando"].join("/");
			v && $("input").on("focus", function () {
				var e = $(this).offset().top;
				return $("html, body").animate({
					scrollTop: e - 150
				}, 600), !1
			});
			var A = function () {
					return !_.homeForm.$invalid || (i.error("Verifique se você digitou o CEP corretamente", "", {
						reject: !0
					}), !1)
				},
				k = function () {
					t.open("https://support.google.com/accounts/answer/61416?hl=pt", "_blank")
				},
				O = function () {
					return A() ? r.post([f, "api/v2/stores/locate"].join("/"), {
						postal_code: _.postal_code
					}).then(function (e) {
						return d.setResponse(e), _.city = "", _.postal_code = d.getPostalCode(_.postal_code), e.data.has_store ? e.data.logged_in ? e : (_.city = e.data.city, o.reject({
							status: 401,
							data: e.data
						})) : (e.data.redirect += e.data.is_market ? "?market=true" : "", e)
					}).catch(function (n) {
						return 406 === n.status && n.data.errors && e.isArray(n.data.errors) && i.warning(n.data.errors.map(function (e) {
							return e.message
						}).join(" \n "), "Atenção", {
							reject: !0
						}), o.reject(n)
					}) : o.reject({
						status: 404,
						data: {
							success: !1
						}
					})
				},
				N = function () {
					return o.when(t.cookieEnabled ? o.resolve(!0) : i.info("Os cookies do seu navegador estão desativados.\nAtive-os e tente novamente.", "Atenção", {
						showCancelButton: !0,
						cancelButtonText: "Saiba mais",
						cancelButtonColor: "#0f52ba"
					}).catch(function () {
						return o.reject({
							status: 403
						})
					}).then(function () {
						return o.reject(!1)
					}))
				};
			_.isDisabled = function (e) {
				return e.$submitted
			}, _.isHome = function () {
				return E === C
			}, _.isLogin = function () {
				return E === y
			}, _.isSignUp = function () {
				return E === b
			}, _.showHome = function (e) {
				e = void 0 !== e && e, E = C, n.$applyAsync(function () {
					_.homeForm.$setPristine(), e && _.homeForm.$setDirty(), c.broadcast(m, null, 300)
				})
			}, _.showLogin = function (e) {
				e = void 0 !== e && e, E = y, n.$applyAsync(function () {
					_.loginForm.$setPristine(), e && _.loginForm.$setDirty(), c.broadcast(m, null, 300)
				})
			}, _.showSignUp = function (e) {
				if (!_.city) return _.showHome();
				e = void 0 !== e && e, E = b, n.$applyAsync(function () {
					_.signUpForm.$setPristine(), e && _.signUpForm.$setDirty(), c.broadcast(m, null, 300)
				})
			}, _.isInvalid = a, _.submitHome = function () {
				return A()
			}, _.needRegister = function () {
				o.when(O()).then(u([f, "mercados/localizando"].join("/"))).catch(function (e) {
					return e && 401 === e.status ? (_.showSignUp(!0), o.resolve()) : o.reject()
				}).catch(function () {
					_.showHome(!0)
				})
			}, _.hasRegister = function () {
				o.when(O()).then(u(f)).catch(function (e) {
					return e && 401 === e.status ? (_.showLogin(), o.resolve()) : o.reject()
				}).catch(function () {
					_.showHome(!0)
				})
			}, _.submitSignUp = function () {
				return _.signUpForm.name.$invalid ? i.warning("Verifique o preenchimento do primeiro nome", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showSignUp(!0)
				}) : _.signUpForm.last_name.$invalid ? i.warning("Verifique o preenchimento do sobrenome", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showSignUp(!0)
				}) : _.signUpForm.email.$invalid ? i.warning("Verifique o preenchimento do email", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showSignUp(!0)
				}) : _.signUpForm.password.$invalid ? i.warning("O campo senha deve conter ao menos 6 caracteres", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showSignUp(!0)
				}) : _.signUpForm.$invalid ? i.warning("Verifique o preenchimento dos campos", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showSignUp(!0)
				}) : _.terms ? o.when(N()).then(function () {
					return h ? window.grecaptcha.execute(h, {
						action: "submit"
					}) : ""
				}).then(function (e) {
					return r.post([f, "api/v2/auth/register"].join("/"), {
						name: _.name,
						last_name: _.last_name,
						email: _.email,
						password: _.password,
						postal_code: _.postal_code,
						accept_marketing_messages: _.accept_marketing_messages,
						captcha: e
					})
				}).then(function (e) {
					return l.set("USER", JSON.stringify(e.data)), r.post([f, "web/login"].join("/"), {
						api_token: e.data.api_token
					}).then(function () {
						return e
					})
				}).then(function (e) {
					return w.registerUser(e.data), i.success("O seu cadastro foi feito com sucesso", "Obrigado!", {
						resolve: e
					})
				}).then(u(p.getRedirect(S))).catch(s(_.signUpForm)).catch(function (e) {
					return 403 === e.status && k(), 406 === e.status ? i.error(e.data.errors.message, "Credenciais incorretas", {
						reject: e
					}) : 422 === e.status || 429 === e.status ? (n = e.data.errors.map(function (e) {
						return e.message
					}).join(" \n "), i.error(n, "Credenciais incorretas", {
						reject: !0
					})) : o.reject();
					var n
				}).catch(function () {
					_.showSignUp(!0)
				}) : i.warning("Você precisa concordar com os termos de uso", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showSignUp(!0)
				})
			}, _.submitLogin = function () {
				return _.loginForm.email.$invalid ? i.warning("Verifique o preenchimento do email", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showLogin(!0)
				}) : _.loginForm.password.$invalid ? i.warning("O campo senha deve conter ao menos 6 caracteres", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showLogin(!0)
				}) : _.loginForm.$invalid ? i.warning("Verifique o preenchimento dos campos", "Atenção", {
					reject: !0
				}).catch(function () {
					_.showLogin(!0)
				}) : o.when(N()).then(function () {
					return r.post([f, "api/v2/auth/login"].join("/"), {
						email: _.email,
						password: _.password,
						postal_code: _.postal_code
					})
				}).then(function (e) {
					return d.setResponse(e), l.set("USER", JSON.stringify(e.data)), r.post([f, "web/login"].join("/"), {
						api_token: e.data.api_token
					}).then(function () {
						return e
					})
				}).then(u(p.getRedirect(S))).catch(s(_.loginForm)).catch(function (e) {
					return 403 === e.status && k(), 406 === e.status ? i.error(e.data.errors.message, "Credenciais incorretas", {
						reject: e
					}) : 422 === e.status || 429 === e.status ? (n = e.data.errors.map(function (e) {
						return e.message
					}).join(" \n "), i.error(n, "Credenciais incorretas", {
						reject: !0
					})) : o.reject();
					var n
				}).catch(function () {
					_.showLogin(!0)
				})
			}, _.facebook = function () {
				var e = l.get(g, null),
					n = "redirect=" + p.getRedirect(S);
				e && (n += "&postal_code=" + e), t.location.href = [
					[f, "facebook"].join("/"), n
				].join("?")
			}, n.$applyAsync(function () {
				_.postal_code || (_.postal_code = l.get(g, ""))
			}), n.$watch("ctrl.postal_code", function (e, n) {
				e !== n && (_.city = "")
			})
		}]), t.run(["snwComingSoonService", function (e) {
			e.initialize()
		}])
	}(window.angular),
	function (e) {
		e.module("snwNowPrime", ["snwCore", "snwModal", "snwGoogleTagManager"]).controller("SubscriptionController", ["$window", "$http", "$swal", "$sce", "SNW_BASE_URL", "GoogleTagManager", function (n, t, r, o, i, a) {
			var s = this;
			s.plans = [], s.reason = null, s.obs = null, s.showModal = !1, s.termsUse = !1, s.disable = !0;
			var c, u;
			s.getCallToAction = function () {
				return s.plans.call_to_action ? s.plans.call_to_action.toUpperCase() : "QUERO ASSINAR"
			}, s.isTrial = function () {
				return !(s.plans.original_value || !s.plans.bonus_days)
			}, s.isPromotional = function () {
				return !!s.plans.original_value
			}, s.isFull = function () {
				return !s.isPromotional() && !s.isTrial()
			}, s.insertSubscription = function (e, n, o, c, u) {
				s.data = {
					subscription_id: n,
					subscription_type_id: e,
					subscription_name: o,
					bonus_day: c,
					value: u
				}, r.confirm(["Deseja assinar?", "Aproveite!"].join(" "), "Now Prime").then(function () {
					t.post([i, "api/v2/subscriptions/now-prime"].join("/"), s.data).then(function () {
						a.registerUserPrime(s.data), r.success("Aproveite o Now Prime! Acesse sua conta para visualizar os detalhes", "Uhul!").then(function () {
							s.navigateTo(i)
						})
					}).catch(function (e) {
						var n;
						if (406 === e.status) {
							if (e && 406 === e.status) return n = e.data.errors.map(function (e) {
								return e.message
							}).join(" \n "), r.error("", n, {
								reject: !0
							})
						} else r.error("Você já é assinante!")
					})
				})
			}, s.cancelPlan = function (e) {
				s.data = {
					params: {
						idSubscription: e,
						idReason: s.reason,
						obs: s.obs
					}
				}, r.confirm(["Deseja cancelar sua assinatura?"].join(" "), "Now Prime ").then(function () {
					t.delete([i, "api/v2/subscriptions/now-prime"].join("/"), s.data).then(function () {
						r.success("Cancelado com sucesso!", "Now Prime").then(function () {
							s.navigateTo(i)
						})
					}), s.showModal = !1
				})
			}, s.reactivatePlan = function (e) {
				s.data = {
					idSubscription: e
				}, r.confirm(["Deseja reativar sua assinatura?"].join(" "), "Now Prime ").then(function () {
					t.post([i, "api/v2/subscriptions/now-prime"].join("/"), s.data).then(function () {
						n.location.reload()
					}), s.showModal = !1
				})
			}, s.addReminder = function (e) {
				s.data = {
					idSubscription: e
				}, r.confirm(["Deseja adicionar um lembrete de sua assinatura?"].join(" "), "Now Prime ").then(function () {
					t.post([i, "api/now-prime-subscription-advice"].join("/"), s.data).then(function () {
						r.success("Você será comunicado 1 dia antes do pagamento!", "Now Prime")
					}), s.showModal = !1
				})
			}, s.navigateTo = function (e) {
				n.location.href = e
			}, s.toggleReason = function () {
				s.disable = !s.disable
			}, s.toggleModal = function () {
				s.showModal = !s.showModal
			}, s.toggleTerms = function () {
				s.termsUse = !s.termsUse
			}, t.get([i, "api/v2/subscriptions"].join("/"), {
				params: {
					promotion: (c = n.location.href.split("/"), u = c[c.length - 1], "now-prime" === u ? null : u.split("?")[0])
				}
			}).then(function (n) {
				s.plans = [], e.isDefined(n.data) && e.isArray(n.data) && (s.plans = n.data[0].types[0], s.plans.description = o.trustAsHtml(s.plans.description))
			}).catch(function () {
				s.plans = []
			})
		}])
	}(window.angular),
	function (e) {
		"use strict";
		e.module("snwFeedback", ["snwCore"]).controller("FeedbackController", ["$window", "$http", "$swal", "$scope", "SNW_BASE_URL", "ORDER_UUID", "RedirectResponse", function (n, t, r, o, i, a, s) {
			var c = this;
			c.track = null, c.rating = null, c.reasons = [], c.nps = null, c.loading = !1, c.comments = null, c.setRating = function (e) {
				c.rating = e
			}, c.setReasons = function (e) {
				c.reasons.indexOf(e) > -1 ? c.reasons.splice(c.reasons.indexOf(e), 1) : c.reasons.push(e), 7 === e && $("#myInput").focus()
			}, c.setNps = function (e) {
				c.nps = e
			}, c.evaluateUserExperience = function () {
				c.loading = !0, t.post([i, "api/v2/orders", c.track.uuid, "feedback"].join("/"), {
					rating: c.rating,
					feedback: c.comments,
					nps: c.nps,
					reasons: c.reasons
				}).then(function () {
					return r.success("Recebemos sua avaliação. Agradecemos por nos ajudar a construir uma experiência cada vez melhor para você.", "Obrigado")
				}).then(s([i, "pedidos", c.track.uuid].join("/"))).catch(function (n) {
					return e.isObject(n) && e.isArray(n.messages) ? r.warning(n.messages.join("/")) : r.error("Preencha todos os campos obrigatórios", "Ops!")
				})
			};
			t.get([i, "api/v2/orders", a].join("/")).then(function (e) {
				c.track = e.data
			}).catch(function () {
				c.track = []
			})
		}])
	}(window.angular),
	function (e) {
		e.module("snwDetailsOrder", ["snwCore"]).controller("DetailsOrderController", ["$window", "$http", "SNW_BASE_URL", "ORDER_ID", "LOOKUP_ORDER_SUBSTITUTION_ID", function (n, t, r, o, i) {
			var a = this;
			a.groups = [];
			t.get([r, "api/cart", o, "groups"].join("/"), {
				params: {
					show_custom_items: !0
				}
			}).then(function (n) {
				a.groups = function (n) {
					for (var t, r, a = [], s = 0; s < n.length; s++) {
						t = {
							name: n[s].name ? "Caixa do(a) " + n[s].name : "Itens do Pedido #" + o,
							items: []
						};
						for (var c = 0; c < n[s].items.length; c++)
							if ((r = n[s].items[c]).substitutions && r.substitutions.length > 0)
								for (var u = 0; u < r.substitutions.length; u++) r.substitutions[u].substitution_label = "Este produto é uma substituição de " + r.name, t.items.push(r.substitutions[u]);
							else r.lookup_order_item_status_id === i.UNAVAILABLE ? (r.unavailable = "Este produto estava indisponível no momento da compra", r.quantity = 0, t.items.push(r)) : t.items.push(r);
						a.push(e.copy(t))
					}
					return a
				}(n.data)
			}).catch(function () {
				a.groups = []
			})
		}])
	}(window.angular),
	function (e, n) {
		"use strict";
		var t = window.angular.module("snwInstitutionalComingSoon", ["snwCore", "snwLockr"]);
		t.controller("ComingSoonController", ["$window", "$http", "$swal", "$timeout", "IsInvalidModel", "AddModelErrorsFromServer", "ValueCleanerService", "snwComingSoonService", "snwLockrService", "SNW_BASE_URL", "POSTAL_CODE_LOCAL_STORAGE_KEY", "SNW_COMING_SOON_NAME", "SNW_COMING_SOON_EMAIL", "SNW_COMING_SOON_ADDRESS", "SNW_COMING_SOON_POSTAL_CODE", function (e, n, t, r, o, i, a, s, c, u, d, l, p, f, m) {
			var g = this;
			g.showWaitNotice = !1;
			var v = a.clear(l),
				h = a.clear(p),
				w = a.digitsOnly(f),
				_ = a.digitsOnly(m);
			if (v = v || s.getName(), h = h || s.getEmail(), v.length && h.length && s.save(v, h), _) return g.showWaitNotice = !0, c.set(d, _), void r(function () {
				e.location.href = u
			}, 600);
			c.set(d, ""), g.data = {
				name: v,
				email: h
			}, g.showForm = function () {
				return !v && !h
			}, g.isInvalid = o, g.submitForm = function () {
				if (g.comingSoonForm.$invalid) return t.warning("Verifique o preenchimento dos campos");
				n.post([u, "api/coming-soon", w].join("/"), g.data).then(function (e) {
					return v = g.data.name, h = g.data.email, s.save(v, h), t.success("Avisaremos quando chegarmos ao seu bairro", "Obrigado por deixar seu contato", {
						resolve: e
					})
				}).catch(i(g.comingSoonForm)).catch(function (e) {
					if (406 === e.status) return t.error("O endereço de e-mail informado não está em nossos cadastros", "E-mail não encontrado")
				})
			}
		}]), t.service("snwComingSoonService", ["ValueCleanerService", "snwLockrService", function (e, n) {
			return {
				initialize: function () {
					n.rm("SNW_COMING_SOON_NAME"), n.rm("SNW_COMING_SOON_EMAIL")
				},
				save: function (t, r) {
					t = e.clear(t), r = e.clear(r), n.set("SNW_COMING_SOON_NAME", t), n.set("SNW_COMING_SOON_EMAIL", r)
				},
				getName: function () {
					var t = n.get("SNW_COMING_SOON_NAME") || "";
					return e.clear(t) || ""
				},
				getEmail: function () {
					var t = n.get("SNW_COMING_SOON_EMAIL") || "";
					return e.clear(t) || ""
				}
			}
		}])
	}();

Inglês
t(t) ? e.post([a, "api/v2/stores/locate"].join("/"), { postal_code: t,
PORTUGUÊS
t (t)? e.post ([a, "api / v2 / stores / locate"]. join ("/"), { postal_code: t,
OPÇÕES DE EXTENSÃOMAIS »
