SHELL := bash
.DEFAULT_GOAL := help

include mk/common.mk
include mk/app.mk
include mk/worker.mk
include mk/test.mk
include mk/supabase.mk
include mk/db.mk
include mk/help.mk
