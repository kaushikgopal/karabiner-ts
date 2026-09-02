WINDOW_LAYOUT_NAME := custom-karabiner-windowlayout-server
WINDOW_LAYOUT_LABEL := sh.kau.$(WINDOW_LAYOUT_NAME)
WINDOW_LAYOUT_PACKAGE := $(CURDIR)/$(WINDOW_LAYOUT_NAME)
WINDOW_LAYOUT_APP := $(HOME)/Applications/$(WINDOW_LAYOUT_NAME).app
WINDOW_LAYOUT_PROGRAM := $(WINDOW_LAYOUT_APP)/Contents/MacOS/$(WINDOW_LAYOUT_NAME)
WINDOW_LAYOUT_AGENT := $(HOME)/Library/LaunchAgents/$(WINDOW_LAYOUT_LABEL).plist
WINDOW_LAYOUT_LOG := $(HOME)/Library/Logs/$(WINDOW_LAYOUT_NAME).log
KARABINER_KT ?= ../karabiner-kt

.PHONY: default help ts generate parity test check fmt fmt-all install-window-server restart-karabiner

default: ts

help:			## list out commands with descriptions
	@sed -ne '/@sed/!s/## //p' $(MAKEFILE_LIST)

ts:			## generate and install karabiner.json (using bun + typescript)
	bun run src/main.ts
	cp ./karabiner.json ~/.config/karabiner/

generate:		## generate karabiner.json without installing it
	bun run src/main.ts

test:			## run tests (bun test)
	bun test

check:			## typecheck (tsc --noEmit)
	bunx tsc --noEmit

install-window-server:	## explicitly build and install the window server
	swift build --package-path $(WINDOW_LAYOUT_PACKAGE) --configuration release
	-@launchctl bootout gui/$(shell id -u)/$(WINDOW_LAYOUT_LABEL) 2>/dev/null
	mkdir -p $(HOME)/Applications $(HOME)/Library/LaunchAgents $(HOME)/Library/Logs
	@SOURCE_HASH=$$({ find $(WINDOW_LAYOUT_PACKAGE)/Sources -type f -name '*.swift' | sort | xargs shasum -a 256; shasum -a 256 $(WINDOW_LAYOUT_PACKAGE)/Package.swift $(WINDOW_LAYOUT_PACKAGE)/Package.resolved $(WINDOW_LAYOUT_PACKAGE)/Info.plist; } | shasum -a 256 | awk '{print $$1}'); \
	CURRENT_HASH=$$(cat $(WINDOW_LAYOUT_APP)/Contents/Resources/source.sha256 2>/dev/null || true); \
	if [ "$$SOURCE_HASH" != "$$CURRENT_HASH" ]; then \
		rm -rf $(WINDOW_LAYOUT_APP); \
		mkdir -p $(WINDOW_LAYOUT_APP)/Contents/MacOS $(WINDOW_LAYOUT_APP)/Contents/Resources; \
		install -m 755 $$(swift build --package-path $(WINDOW_LAYOUT_PACKAGE) --configuration release --show-bin-path)/CustomKarabinerWindowLayoutServer $(WINDOW_LAYOUT_PROGRAM); \
		cp $(WINDOW_LAYOUT_PACKAGE)/Info.plist $(WINDOW_LAYOUT_APP)/Contents/Info.plist; \
		printf '%s\n' "$$SOURCE_HASH" > $(WINDOW_LAYOUT_APP)/Contents/Resources/source.sha256; \
		codesign --force --deep --sign - --identifier $(WINDOW_LAYOUT_LABEL) $(WINDOW_LAYOUT_APP); \
	fi
	sed \
		-e 's|__PROGRAM_PATH__|$(WINDOW_LAYOUT_PROGRAM)|g' \
		-e 's|__LOG_PATH__|$(WINDOW_LAYOUT_LOG)|g' \
		$(WINDOW_LAYOUT_PACKAGE)/$(WINDOW_LAYOUT_LABEL).plist > $(WINDOW_LAYOUT_AGENT)
	plutil -lint $(WINDOW_LAYOUT_AGENT)
	launchctl bootstrap gui/$(shell id -u) $(WINDOW_LAYOUT_AGENT)

restart-karabiner:	## restart karabiner user-server forcibly
	launchctl kickstart -k gui/$(shell id -u)/org.pqrs.service.agent.karabiner_console_user_server

parity:			## verify output byte-parity with karabiner-kt
	bun run src/main.ts
	cd $(KARABINER_KT) && ./gradlew -q run
	diff ./karabiner.json $(KARABINER_KT)/app/karabiner.json
	@echo "karabiner.json: parity OK"
	@CHANGES=$$(rsync -a --delete --dry-run --itemize-changes --omit-dir-times --exclude='.build' --exclude='.git' \
		$(KARABINER_KT)/$(WINDOW_LAYOUT_NAME)/ ./$(WINDOW_LAYOUT_NAME)/); \
	if [ -n "$$CHANGES" ]; then \
		echo "window-layout server DRIFTED from karabiner-kt:"; \
		echo "$$CHANGES"; \
		exit 1; \
	else \
		echo "window-layout server: in sync"; \
	fi

fmt:			## prettier changed files on this branch
	@echo "--- This script will run prettier on all changed files"
	@MERGE_BASE=$$(git merge-base HEAD origin/master); \
	MODIFIED_FILES=$$(git diff $$MERGE_BASE --diff-filter=ACMR --name-only --relative -- '*.ts'); \
	for FILE in $$MODIFIED_FILES; do \
		echo "Formatting $$FILE"; \
		bunx prettier --write "$$FILE"; \
	done

fmt-all:		## prettier all files
	@echo "--- This script will run prettier on all files"
	@bunx prettier --write "src/**/*.ts"
