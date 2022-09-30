;; contracts/storage-contract.clar

;; define variables
(define-data-var storage (string-utf8 500) u"initial value")

;; define public get function
(define-read-only (get-storage)
    (var-get storage)
)

;; define public write function
;; #[allow(unchecked_data)]
(define-public (set-storage (message (string-utf8 500)))
    (ok (var-set storage message))
)