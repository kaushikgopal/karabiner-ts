# Installed under the kg- name; every install tears down the old app and
# resets its Accessibility grant, so a rebuilt binary starts with a fresh
# TCC entry instead of a stale one that silently stopped matching.
# TCC entry instead of a stale one that silently stopped matching.
WINDOW_LAYOUT_PACKAGE := $(CURDIR)/kg-windowlayout-karabiner-server
WINDOW_LAYOUT_NAME := kg-windowlayout-karabiner-server
WINDOW_LAYOUT_LABEL := kg-windowlayout-karabiner-server
WINDOW_LAYOUT_LEGACY_NAME := kg-windowlayout-karabiner-server
WINDOW_LAYOUT_LEGACY_LABEL := sh.kau.$(WINDOW_LAYOUT_LEGACY_NAME)
WINDOW_LAYOUT_APP := $(HOME)/Applications/$(WINDOW_LAYOUT_NAME).app
WINDOW_LAYOUT_PROGRAM := $(WINDOW_LAYOUT_APP)/Contents/MacOS/$(WINDOW_LAYOUT_NAME)
WINDOW_LAYOUT_AGENT := $(HOME)/Library/LaunchAgents/$(WINDOW_LAYOUT_LABEL).plist
WINDOW_LAYOUT_LOG := $(HOME)/Library/Logs/$(WINDOW_LAYOUT_NAME).log
.PHONY: default help ts generate test check fmt fmt-all install-window-server restart-window-server restart-karabiner

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

install-window-server:	## reinstall the window server, reset its Accessibility grant, open Settings (not left running)
	swift build --package-path $(WINDOW_LAYOUT_PACKAGE) --configuration release
	-@launchctl bootout gui/$(shell id -u)/$(WINDOW_LAYOUT_LABEL) 2>/dev/null
	-@launchctl bootout gui/$(shell id -u)/$(WINDOW_LAYOUT_LEGACY_LABEL) 2>/dev/null
	rm -rf $(WINDOW_LAYOUT_APP) $(HOME)/Applications/$(WINDOW_LAYOUT_LEGACY_NAME).app
	rm -f $(HOME)/Library/LaunchAgents/$(WINDOW_LAYOUT_LEGACY_LABEL).plist
	-tccutil reset Accessibility $(WINDOW_LAYOUT_LABEL) 2>/dev/null
	-tccutil reset Accessibility $(WINDOW_LAYOUT_LEGACY_LABEL) 2>/dev/null
	mkdir -p $(HOME)/Applications $(HOME)/Library/LaunchAgents $(HOME)/Library/Logs
	mkdir -p $(WINDOW_LAYOUT_APP)/Contents/MacOS $(WINDOW_LAYOUT_APP)/Contents/Resources
	install -m 755 $$(swift build --package-path $(WINDOW_LAYOUT_PACKAGE) --configuration release --show-bin-path)/CustomKarabinerWindowLayoutServer $(WINDOW_LAYOUT_PROGRAM)
	sed \
		-e 's|$(WINDOW_LAYOUT_LEGACY_LABEL)|$(WINDOW_LAYOUT_LABEL)|g' \
		-e 's|$(WINDOW_LAYOUT_LEGACY_NAME)|$(WINDOW_LAYOUT_NAME)|g' \
		$(WINDOW_LAYOUT_PACKAGE)/Info.plist > $(WINDOW_LAYOUT_APP)/Contents/Info.plist
	printf '%s\n' "installed $$(date)" > $(WINDOW_LAYOUT_APP)/Contents/Resources/source.sha256
	codesign --force --deep --sign - --identifier $(WINDOW_LAYOUT_LABEL) $(WINDOW_LAYOUT_APP)
	sed \
		-e 's|__PROGRAM_PATH__|$(WINDOW_LAYOUT_PROGRAM)|g' \
		-e 's|__LOG_PATH__|$(WINDOW_LAYOUT_LOG)|g' \
		$(WINDOW_LAYOUT_PACKAGE)/$(WINDOW_LAYOUT_LABEL).plist > $(WINDOW_LAYOUT_AGENT)
	plutil -lint $(WINDOW_LAYOUT_AGENT)
	# The Accessibility list only shows apps that have requested the grant, so
	# start the server once to trigger its prompt, then stop it again.
	launchctl bootstrap gui/$(shell id -u) $(WINDOW_LAYOUT_AGENT)
	sleep 2
	-@launchctl bootout gui/$(shell id -u)/$(WINDOW_LAYOUT_LABEL) 2>/dev/null
	open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
	@echo "---------------------------------------------------------------"
	@echo "1. Enable $(WINDOW_LAYOUT_NAME) in the Accessibility list that just opened"
	@echo "2. make restart-window-server"
	@echo "---------------------------------------------------------------"

restart-window-server:	## start (or restart) the window server
	-@launchctl bootout gui/$(shell id -u)/$(WINDOW_LAYOUT_LABEL) 2>/dev/null
	launchctl bootstrap gui/$(shell id -u) $(WINDOW_LAYOUT_AGENT)

restart-karabiner:	## restart karabiner user-server forcibly
	launchctl kickstart -k gui/$(shell id -u)/org.pqrs.service.agent.karabiner_console_user_server

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
