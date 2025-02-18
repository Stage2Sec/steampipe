package interactive

import (
	"context"
	"log"

	"github.com/spf13/viper"
	"github.com/turbot/steampipe/pkg/constants"
	"github.com/turbot/steampipe/pkg/statushooks"
	"github.com/turbot/steampipe/pkg/steampipeconfig/modconfig"
	"github.com/turbot/steampipe/pkg/workspace"
)

func LoadWorkspacePromptingForVariables(ctx context.Context) (*workspace.Workspace, error) {
	workspacePath := viper.GetString(constants.ArgModLocation)

	w, err := workspace.Load(ctx, workspacePath)
	if err == nil {
		return w, nil
	}
	missingVariablesError, ok := err.(modconfig.MissingVariableError)
	// if there was an error which is NOT a MissingVariableError, return it
	if !ok {
		return nil, err
	}
	// if interactive input is disabled, return the missing variables error
	if !viper.GetBool(constants.ArgInput) {
		return nil, missingVariablesError
	}
	// so we have missing variables - prompt for them
	// first hide spinner if it is there
	statushooks.Done(ctx)
	if err := PromptForMissingVariables(ctx, missingVariablesError.MissingVariables, workspacePath); err != nil {
		log.Printf("[TRACE] Interactive variables prompting returned error %v", err)
		return nil, err
	}
	// ok we should have all variables now - reload workspace
	return workspace.Load(ctx, workspacePath)
}
