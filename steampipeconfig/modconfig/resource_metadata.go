package modconfig

import "github.com/turbot/go-kit/types"

// ResourceWithMetadata :: a mod resource which supports metadata
type ResourceWithMetadata interface {
	GetMetadata() *ResourceMetadata
}

// ResourceMetadata :: additional data we collect about each resource to populate the reflection tables
type ResourceMetadata struct {
	ResourceName string `column:"resource_name" column_type:"varchar(40)"`
	// mod name in the format mod.<modName>@<version?
	ModName          string `column:"mod_name" column_type:"varchar(40)"`
	FileName         string `column:"file_name" column_type:"text"`
	StartLineNumber  int    `column:"start_line_number" column_type:"integer"`
	EndLineNumber    int    `column:"end_line_number" column_type:"integer"`
	IsAutoGenerated  bool   `column:"auto_generated" column_type:"bool"`
	SourceDefinition string `column:"source_definition" column_type:"text"`

	// mod short name
	ModShortName string
}

// SetMod set the mod name and mod short name
func (m *ResourceMetadata) SetMod(mod *Mod) {
	m.ModShortName = types.SafeString(mod.ShortName)
	m.ModName = mod.Name()
}

// TODO ADD PATH ltree
