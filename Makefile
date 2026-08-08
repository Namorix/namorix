IMAGE := izerocs/namorix
VERSION := 1.0
PLATFORMS := linux/amd64,linux/arm64

.PHONY: build push

push:
	docker buildx build --platform $(PLATFORMS) \
		-t $(IMAGE):$(VERSION) \
		-t $(IMAGE):latest \
		--push .
