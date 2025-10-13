const PageHeader = ({ title, onBack }) => (
    <View style={styles.appHeader}>
      <TouchableOpacity onPress={onBack} style={styles.headerButton}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );