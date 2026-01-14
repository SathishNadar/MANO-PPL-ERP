import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 7,
        color: '#000000',
    },
    borderBox: {
        border: '1pt solid #000000',
        marginBottom: 0,
    },
    headerRow: {
        flexDirection: 'row',
        height: 60,
        borderBottom: '1pt solid #000000',
    },
    logoSection: {
        width: '20%',
        borderRight: '1pt solid #000000',
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },
    titleSection: {
        width: '60%',
        borderRight: '1pt solid #000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    infoSection: {
        width: '20%',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    // Project Info Rows
    projectInfoRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
    },
    infoLabel: {
        fontFamily: 'Helvetica-Bold',
        padding: 4,
    },
    infoValue: {
        flex: 1,
        padding: 4,
    },
    // Table Styles
    table: {
        flexDirection: 'column',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: '1pt solid #000000',
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        minHeight: 25,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 25,
    },
    // Column Widths
    colSno: { width: '3%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colName: { width: '15%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colNature: { width: '12%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colPerson: { width: '10%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colTel: { width: '7%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colMob: { width: '12%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colEmail: { width: '15%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colAddress: { width: '14%', borderRight: '1pt solid #000000', padding: 3, justifyContent: 'center' },
    colWebsite: { width: '12%', padding: 3, justifyContent: 'center' },

    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
    },
});

const formatLongData = (data) => {
    if (!data) return "-";
    // Replace slashes and commas with space to encourage wrapping in long strings
    return String(data).replace(/[\/,]/g, (match) => `${match} `);
};

const ProjectVendorsPDF = ({ vendors, project }) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.borderBox}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            <Image src="/Mano-Logo.png" style={styles.logo} />
                        </View>
                        <View style={styles.titleSection}>
                            <Text style={styles.titleText}>Project Vendor List</Text>
                        </View>
                        <View style={styles.infoSection}>
                            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Date: {new Date().toLocaleDateString("en-GB")}</Text>
                        </View>
                    </View>

                    {/* Project Info */}
                    <View style={styles.projectInfoRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderRight: '1pt solid #000000' }}>
                            <Text style={styles.infoLabel}>Project:</Text>
                            <Text style={styles.infoValue}>{project?.project_name || "-"}</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.infoLabel}>Client:</Text>
                            <Text style={styles.infoValue}>{project?.Employer || "-"}</Text>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                            <View style={styles.colSno}><Text>Sr No</Text></View>
                            <View style={styles.colName}><Text>Name of the Vendor/Agency</Text></View>
                            <View style={styles.colNature}><Text>Nature of the Jobs {"\n"} Carried Out</Text></View>
                            <View style={styles.colPerson}><Text>Contact Person</Text></View>
                            <View style={styles.colTel}><Text>Telephone No.</Text></View>
                            <View style={styles.colMob}><Text>Mobile No.</Text></View>
                            <View style={styles.colEmail}><Text>Email ID</Text></View>
                            <View style={styles.colAddress}><Text>Address</Text></View>
                            <View style={styles.colWebsite}><Text>Website</Text></View>
                        </View>

                        {/* Table Rows */}
                        {vendors.map((vendor, index) => (
                            <View key={vendor.pv_id || vendor.id} style={[styles.tableRow, index === vendors.length - 1 ? { borderBottom: 0 } : {}]}>
                                <View style={styles.colSno}><Text>{index + 1}</Text></View>
                                <View style={styles.colName}><Text>{vendor.company_name || vendor.name || "-"}</Text></View>
                                <View style={styles.colNature}><Text>{vendor.job_nature || vendor.natureOfJob || "-"}</Text></View>
                                <View style={styles.colPerson}><Text>{vendor.contact_person || vendor.contactPerson || "-"}</Text></View>
                                <View style={styles.colTel}><Text>{vendor.telephone_no || vendor.telephone || "-"}</Text></View>
                                <View style={styles.colMob}><Text>{formatLongData(vendor.mobile_no || vendor.mobile)}</Text></View>
                                <View style={styles.colEmail}><Text>{formatLongData(vendor.email_id || vendor.email)}</Text></View>
                                <View style={styles.colAddress}><Text>{formatLongData(vendor.address)}</Text></View>
                                <View style={styles.colWebsite}><Text>{vendor.website || "-"}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

export default ProjectVendorsPDF;
